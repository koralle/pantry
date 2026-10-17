import { describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  appFetch: vi.fn(async () => await Promise.resolve(new Response("web-app"))),
}));

// TanStack Start の handler は起動せず、web 側に来たことだけを返す。
vi.mock("@tanstack/react-start/server-entry", () => ({
  createServerEntry: <T>(entry: T): T => entry,
  default: { fetch: mocks.appFetch },
}));

import server from "./server";

/**
 * `env.API` は vitest.config.ts の stub（503、受けたリクエストを x-stub-* で返す）。
 * server.ts の振り分けと、元の Request がそのまま binding へ渡ることを確かめる。
 */
const dispatch = async (path: string, init?: RequestInit) =>
  await server.fetch(new Request(`https://pantry.test${path}`, init));

describe("server entry", () => {
  test.each(["/rpc/me", "/rpc/health", "/api/auth/get-session"])(
    "%s は pantry-api の Service Binding へ渡す",
    async (path) => {
      mocks.appFetch.mockClear();

      const response = await dispatch(path, {
        body: "{}",
        headers: {
          "cf-connecting-ip": "203.0.113.7",
          cookie: "better-auth.session_token=abc",
        },
        method: "POST",
      });

      expect(response.status).toBe(503);
      expect(response.headers.get("x-stub-path")).toBe(path);
      expect(response.headers.get("x-stub-method")).toBe("POST");
      expect(response.headers.get("x-stub-cookie")).toBe(
        "better-auth.session_token=abc"
      );
      expect(response.headers.get("x-stub-client-ip")).toBe("203.0.113.7");
      expect(mocks.appFetch).not.toHaveBeenCalled();
    }
  );

  test.each([
    "/api/rpc/bookmarks/list",
    "/rpc",
    "/",
    "/bookmarks",
    "/api/auth",
  ])("%s は web（TanStack Start）が処理する", async (path) => {
    mocks.appFetch.mockClear();

    const response = await dispatch(path);

    await expect(response.text()).resolves.toBe("web-app");
    expect(response.headers.get("x-stub-path")).toBeNull();
    expect(mocks.appFetch).toHaveBeenCalledTimes(1);
  });
});
