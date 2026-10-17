import { RPCHandler } from "@orpc/server/fetch";
import { Hono } from "hono";

import type { Authenticator } from "./auth/session";
import { createRouter } from "./rpc/router";

/** Hono app が必要とする能力。本番は better-auth、テストは stub を渡す。 */
export interface AppDeps {
  readonly authenticate: Authenticator;
  readonly handleAuthRequest: (request: Request) => Promise<Response>;
}

/**
 * `/rpc/*` は oRPC の RPCHandler、`/api/auth/*` は Better Auth の handler へ渡す。
 * それ以外は Hono の 404。
 *
 * エラーは握りつぶさない。未知の障害は oRPC / Better Auth の既定どおり 500 へ抜け、
 * 内部 message や cause は client へ返さない（docs/architecture.md の procedure 契約）。
 */
export const createApp = (deps: AppDeps) => {
  const app = new Hono();
  const rpcHandler = new RPCHandler(
    createRouter({ authenticate: deps.authenticate })
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
