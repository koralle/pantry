import { onError, ORPCError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { ResponseHeadersPlugin } from "@orpc/server/plugins";
import type { AppDb } from "@pantry/db";
import { Hono } from "hono";
import type { MiddlewareHandler } from "hono";
import { csrf } from "hono/csrf";

import type { Authenticator } from "./auth/session";
import { createRouter } from "./rpc/router";

/** Hono app が必要とする能力。本番は better-auth、テストは stub を渡す。 */
export interface AppDeps {
  readonly authenticate: Authenticator;
  /** isolate ごとに遅延生成するため関数で受ける。 */
  readonly db: () => AppDb;
  readonly handleAuthRequest: (request: Request) => Promise<Response>;
  /** procedure の想定外の失敗を記録する。既定は `console.error`（Workers Logs に残る）。 */
  readonly reportError?: (error: unknown) => void;
  /** module の import 時に env を読まずに済むよう関数で受ける。 */
  readonly trustedOrigin: () => string;
}

/** 4xx の ORPCError は契約どおりの応答なので記録しない。 */
const isUnexpectedError = (error: unknown): boolean =>
  !(error instanceof ORPCError) || error.status >= 500;

/**
 * 想定外の失敗を server 側にだけ記録するのは、500 では内部 message や cause を client へ
 * 返さない（docs/architecture.md の procedure 契約）ため。
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
      ],
    }
  );

  app.on(
    ["GET", "POST"],
    "/api/auth/*",
    async (c) => await deps.handleAuthRequest(c.req.raw)
  );

  let rpcCsrf: MiddlewareHandler | undefined;
  /**
   * RPCHandler は content-type の無い body を JSON、multipart を RPC の payload として読むため、
   * 別サイトの form / `no-cors` fetch がそのまま procedure に届いてしまうため。
   *
   * `same-site` を許さないのは、`*.workers.dev` の兄弟 Worker が same-site になり cookie も届くため。
   * `/api/auth/*` に掛けないのは、better-auth が trustedOrigins でより厳しく検査しているため。
   */
  app.use("/rpc/*", async (c, next) => {
    if (rpcCsrf === undefined) {
      try {
        rpcCsrf = csrf({ origin: deps.trustedOrigin() });
      } catch (error) {
        // Origin を確かめられないまま procedure を動かさない（fail closed）。
        reportError(error);
        return c.text("Internal Server Error", 500);
      }
    }
    return await rpcCsrf(c, next);
  });

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
