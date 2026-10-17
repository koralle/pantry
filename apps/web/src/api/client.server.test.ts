import { implement, ORPCError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { contract } from "@pantry/api-contract";
import { describe, expect, test } from "vitest";

import { getSessionUser } from "../features/auth/server/get-session-user.server";
import { createApiServerClient } from "./client.server";

const SESSION_COOKIE = "better-auth.session_token=valid";

/** pantry-api の代わりに contract だけを実装した fake。Cookie で `me` を判定する。 */
interface SeenRequest {
  readonly cookie: string | null;
  readonly pathname: string;
}

const createFakeApi = (seen: SeenRequest[]) => {
  const os = implement(contract).$context<{ headers: Headers }>();
  const router = os.router({
    health: os.health.handler(() => ({ status: "ok" as const })),
    me: os.me.handler(({ context }) => {
      if (context.headers.get("cookie") !== SESSION_COOKIE) {
        throw new ORPCError("UNAUTHORIZED");
      }
      return { email: "koralle@example.com", id: "user_1", name: "koralle" };
    }),
  });
  const handler = new RPCHandler(router);

  return async (request: Request): Promise<Response> => {
    seen.push({
      cookie: request.headers.get("cookie"),
      pathname: new URL(request.url).pathname,
    });
    const { matched, response } = await handler.handle(request, {
      context: { headers: request.headers },
      prefix: "/rpc",
    });
    return matched ? response : new Response("Not Found", { status: 404 });
  };
};

describe("createApiServerClient", () => {
  test("受けた Cookie を api の /rpc へ転送する", async () => {
    const seen: SeenRequest[] = [];
    const client = createApiServerClient(SESSION_COOKIE, createFakeApi(seen));

    await expect(client.health()).resolves.toStrictEqual({ status: "ok" });
    expect(seen).toStrictEqual([
      { cookie: SESSION_COOKIE, pathname: "/rpc/health" },
    ]);
  });

  test("Cookie が無ければ cookie header を付けない", async () => {
    const seen: SeenRequest[] = [];
    const client = createApiServerClient(null, createFakeApi(seen));

    await client.health();
    expect(seen).toStrictEqual([{ cookie: null, pathname: "/rpc/health" }]);
  });
});

describe("getSessionUser", () => {
  test("me の結果を SessionUser として返す", async () => {
    const client = createApiServerClient(SESSION_COOKIE, createFakeApi([]));

    await expect(getSessionUser(client)).resolves.toStrictEqual({
      email: "koralle@example.com",
      id: "user_1",
      name: "koralle",
    });
  });

  test("UNAUTHORIZED は null にする", async () => {
    const client = createApiServerClient(
      "better-auth.session_token=expired",
      createFakeApi([])
    );

    await expect(getSessionUser(client)).resolves.toBeNull();
  });

  test("api の障害は未認証にせず投げる", async () => {
    const client = createApiServerClient(
      SESSION_COOKIE,
      async () => await Promise.resolve(new Response("boom", { status: 500 }))
    );

    await expect(getSessionUser(client)).rejects.toThrow();
  });
});
