import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import { describe, expect, test, vi } from "vitest";

import type { SessionUser } from "../../features/auth/domain/auth-values";
import type { FetchPageTitleOutput } from "../../features/bookmarks/application/fetch-page-title";
import { handleRpcRequest } from "../server/handle-request.server";
import { createAppRouter } from "./create-app-router";
import type { AppRouter } from "./create-app-router";
import { stubAppRouterDeps } from "./test-deps";

const userId = "user-1";

const sessionUser: SessionUser = {
  email: "koralle@example.com",
  id: userId,
  name: "koralle",
};

type ReadDeps = Parameters<typeof createAppRouter>[0];

function baseDeps(): ReadDeps {
  return {
    ...stubAppRouterDeps(),
    fetchPageTitle: vi.fn(async (): Promise<FetchPageTitleOutput> => ({
      kind: "unavailable",
    })),
    getSession: vi.fn(async () => sessionUser),
  };
}

function authenticatedRouter(deps: Partial<ReadDeps> = {}) {
  const merged = { ...baseDeps(), ...deps };
  return createAppRouter(merged);
}

/** HTTP サーバーや Turso を立てず、クライアント契約とステータスだけを見るため process 内の handler へ繋ぐ。 */
function createTestClient(router: AppRouter, headers?: HeadersInit) {
  let lastResponse: Response | undefined;
  let lastBodyText: string | undefined;
  const link = new RPCLink({
    fetch: async (request) => {
      lastResponse = await handleRpcRequest(request, router);
      lastBodyText = await lastResponse.clone().text();
      return lastResponse;
    },
    headers: () => new Headers(headers),
    url: "https://pantry.test/api/rpc",
  });
  const client: RouterClient<AppRouter> = createORPCClient(link);
  return {
    client,
    getBodyText: async () => {
      if (lastResponse === undefined) {
        throw new Error("RPC client did not perform a request");
      }
      return lastBodyText ?? "";
    },
    getResponse: () => {
      if (lastResponse === undefined) {
        throw new Error("RPC client did not perform a request");
      }
      return lastResponse;
    },
  };
}

describe("auth.session RPC", () => {
  test("未認証は null を返す（401 にしない）", async () => {
    const router = authenticatedRouter({ getSession: async () => null });
    const { client, getResponse } = createTestClient(router);

    await expect(client.auth.session()).resolves.toBeNull();
    expect(getResponse().status).toBe(200);
  });

  test("user の projection は id・name・email のみ", async () => {
    const router = authenticatedRouter();
    const { client } = createTestClient(router);

    await expect(client.auth.session()).resolves.toStrictEqual({
      user: {
        email: "koralle@example.com",
        id: userId,
        name: "koralle",
      },
    });
  });

  test("Cookie ヘッダーが public procedure の getSession へ届く", async () => {
    const getSession = vi.fn(async (headers: Headers) => {
      expect(headers.get("cookie")).toBe("better-auth.session_token=abc");
      return sessionUser;
    });
    const router = authenticatedRouter({ getSession });
    const { client } = createTestClient(router, {
      cookie: "better-auth.session_token=abc",
    });

    await client.auth.session();

    expect(getSession).toHaveBeenCalledOnce();
  });
});
