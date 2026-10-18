import { onError, ORPCError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import {
  ResponseHeadersPlugin,
  SimpleCsrfProtectionHandlerPlugin,
} from "@orpc/server/plugins";
import type { AppDb } from "@pantry/db";
import { Hono } from "hono";

import type { Authenticator } from "./auth/session";
import { isCsrfExemptProcedure } from "./rpc/csrf";
import { createRouter } from "./rpc/router";

/** Hono app が必要とする能力。本番は better-auth、テストは stub を渡す。 */
export interface AppDeps {
  readonly authenticate: Authenticator;
  /** isolate ごとに遅延生成するため関数で受ける。 */
  readonly db: () => AppDb;
  readonly handleAuthRequest: (request: Request) => Promise<Response>;
  /** procedure の想定外の失敗を記録する。既定は `console.error`（Workers Logs に残る）。 */
  readonly reportError?: (error: unknown) => void;
}

/** 4xx の ORPCError は契約どおりの応答なので記録しない。 */
const isUnexpectedError = (error: unknown): boolean =>
  !(error instanceof ORPCError) || error.status >= 500;

/**
 * 想定外の失敗を server 側にだけ記録するのは、500 では内部 message や cause を client へ
 * 返さない（docs/architecture.md の procedure 契約）ため。
 *
 * 独自ヘッダー（`x-csrf-token`）を要求するのは、別サイトの form や
 * `fetch(..., { mode: "no-cors" })` はそれを付けられず、付けようとすると CORS の preflight で止まるため。
 */
export const createApp = (deps: AppDeps) => {
  const app = new Hono();
  const reportError =
    deps.reportError ??
    ((error: unknown) => {
      console.error("[rpc] unexpected error", error);
    });
  const rpcHandler = new RPCHandler(
    createRouter({ authenticate: deps.authenticate, db: deps.db }),
    {
      interceptors: [
        onError((error) => {
          if (isUnexpectedError(error)) {
            reportError(error);
          }
        }),
      ],
      plugins: [
        // session の延長（authenticator の Set-Cookie）をブラウザへ届けるため。
        new ResponseHeadersPlugin(),
        new SimpleCsrfProtectionHandlerPlugin({
          exclude: ({ path }) => isCsrfExemptProcedure(path),
        }),
      ],
    }
  );

  app.on(
    ["GET", "POST"],
    "/api/auth/*",
    async (c) => await deps.handleAuthRequest(c.req.raw)
  );

  app.use("/rpc/*", async (c) => {
    const { matched, response } = await rpcHandler.handle(c.req.raw, {
      context: {
        headers: c.req.raw.headers,
      },
      prefix: "/rpc",
    });

    if (!matched) {
      return await c.notFound();
    }

    return c.newResponse(response.body, response);
  });

  return app;
};
