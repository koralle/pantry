import { onError, ORPCError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { Hono } from "hono";

import type { Authenticator } from "./auth/session";
import { createRouter } from "./rpc/router";

/** Hono app が必要とする能力。本番は better-auth、テストは stub を渡す。 */
export interface AppDeps {
  readonly authenticate: Authenticator;
  readonly handleAuthRequest: (request: Request) => Promise<Response>;
  /** procedure の想定外の失敗を記録する。既定は `console.error`（Workers Logs に残る）。 */
  readonly reportError?: (error: unknown) => void;
}

/** 4xx の ORPCError は契約どおりの応答なので記録しない。 */
const isUnexpectedError = (error: unknown): boolean =>
  !(error instanceof ORPCError) || error.status >= 500;

/**
 * `/rpc/*` は oRPC の RPCHandler、`/api/auth/*` は Better Auth の handler へ渡す。
 * それ以外は Hono の 404。
 *
 * エラーは握りつぶさない。未知の障害は oRPC / Better Auth の既定どおり 500 へ抜け、
 * 内部 message や cause は client へ返さない（docs/architecture.md の procedure 契約）。
 * その代わり、想定外の失敗は onError interceptor で server 側にだけ記録する。
 */
export const createApp = (deps: AppDeps) => {
  const app = new Hono();
  const reportError =
    deps.reportError ??
    ((error: unknown) => {
      console.error("[rpc] unexpected error", error);
    });
  const rpcHandler = new RPCHandler(
    createRouter({ authenticate: deps.authenticate }),
    {
      interceptors: [
        onError((error) => {
          if (isUnexpectedError(error)) {
            reportError(error);
          }
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
