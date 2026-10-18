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

const REFRESHED_COOKIE =
  "better-auth.session_token=valid; Max-Age=604800; Path=/; HttpOnly; SameSite=Lax";

const withCookie = (cookie: string): Headers => new Headers({ cookie });

const createFakeApi = (
  seen: SeenRequest[],
  { refresh = false }: { readonly refresh?: boolean } = {}
) => {
  // 機能の procedure は契約ごとに増えるので、追従しなくて済むよう health / me に絞る。
  const os = implement({ health: contract.health, me: contract.me }).$context<{
    headers: Headers;
  }>();
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
    if (!matched) {
      return new Response("Not Found", { status: 404 });
    }
    if (refresh) {
      response.headers.append("set-cookie", REFRESHED_COOKIE);
    }
    return response;
  };
};

describe("createApiServerClient", () => {
  test("受けた Cookie を api の /rpc へ転送する", async () => {
    const seen: SeenRequest[] = [];
    const client = createApiServerClient(withCookie(SESSION_COOKIE), {
      apiFetch: createFakeApi(seen),
    });

    await expect(client.health()).resolves.toStrictEqual({ status: "ok" });
    expect(seen).toStrictEqual([
      { cookie: SESSION_COOKIE, pathname: "/rpc/health" },
    ]);
  });

  test("Cookie が無ければ cookie header を付けない", async () => {
    const seen: SeenRequest[] = [];
    const client = createApiServerClient(new Headers(), {
      apiFetch: createFakeApi(seen),
    });

    await client.health();
    expect(seen).toStrictEqual([{ cookie: null, pathname: "/rpc/health" }]);
  });

  test("クライアント IP のヘッダーは転送し、それ以外は転送しない", async () => {
    const forwarded: Headers[] = [];
    const client = createApiServerClient(
      new Headers({
        authorization: "Bearer should-not-leak",
        "cf-connecting-ip": "203.0.113.7",
        cookie: SESSION_COOKIE,
        "x-forwarded-for": "203.0.113.7",
      }),
      {
        apiFetch: async (request) => {
          forwarded.push(request.headers);
          return await createFakeApi([])(request);
        },
      }
    );

    await client.health();
    expect(forwarded[0]?.get("cf-connecting-ip")).toBe("203.0.113.7");
    expect(forwarded[0]?.get("x-forwarded-for")).toBe("203.0.113.7");
    expect(forwarded[0]?.get("authorization")).toBeNull();
  });

  test("api が要求する x-csrf-token を付ける", async () => {
    const forwarded: Headers[] = [];
    const client = createApiServerClient(withCookie(SESSION_COOKIE), {
      apiFetch: async (request) => {
        forwarded.push(request.headers);
        return await createFakeApi([])(request);
      },
    });

    await client.health();
    expect(forwarded[0]?.get("x-csrf-token")).toBe("orpc");
  });

  test("api の Set-Cookie を onSetCookie へ渡す", async () => {
    const received: (readonly string[])[] = [];
    const client = createApiServerClient(withCookie(SESSION_COOKIE), {
      apiFetch: createFakeApi([], { refresh: true }),
      onSetCookie: (cookies) => {
        received.push(cookies);
      },
    });

    await expect(client.me()).resolves.toMatchObject({ id: "user_1" });
    expect(received).toStrictEqual([[REFRESHED_COOKIE]]);
  });

  test("Set-Cookie が無ければ onSetCookie を呼ばない", async () => {
    const received: (readonly string[])[] = [];
    const client = createApiServerClient(withCookie(SESSION_COOKIE), {
      apiFetch: createFakeApi([]),
      onSetCookie: (cookies) => {
        received.push(cookies);
      },
    });

    await client.me();
    expect(received).toStrictEqual([]);
  });
});

describe("getSessionUser", () => {
  test("me の結果を SessionUser として返す", async () => {
    const client = createApiServerClient(withCookie(SESSION_COOKIE), {
      apiFetch: createFakeApi([]),
    });

    await expect(getSessionUser(client)).resolves.toStrictEqual({
      email: "koralle@example.com",
      id: "user_1",
      name: "koralle",
    });
  });

  test("UNAUTHORIZED は null にする", async () => {
    const client = createApiServerClient(
      withCookie("better-auth.session_token=expired"),
      { apiFetch: createFakeApi([]) }
    );

    await expect(getSessionUser(client)).resolves.toBeNull();
  });

  test("api の障害は未認証にせず投げる", async () => {
    const client = createApiServerClient(withCookie(SESSION_COOKIE), {
      apiFetch: async () =>
        await Promise.resolve(new Response("boom", { status: 500 })),
    });

    await expect(getSessionUser(client)).rejects.toThrow();
  });
});
