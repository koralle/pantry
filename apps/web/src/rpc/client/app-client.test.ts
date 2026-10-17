import { createORPCClient } from "@orpc/client";
import type { ClientLink } from "@orpc/client";
import { describe, expect, it } from "vitest";

import { createAppLink, isApiProcedurePath } from "./app-client";
import type { AppClient } from "./app-client";

const recordingLink = (name: string, calls: string[]): ClientLink<object> => ({
  call: async (path) => {
    calls.push(`${name}:${path.join("/")}`);
    await Promise.resolve();
    return null;
  },
});

describe("isApiProcedurePath", () => {
  it("api-contract の procedure だけを api 行きと判定する", () => {
    expect(isApiProcedurePath(["health"])).toBe(true);
    expect(isApiProcedurePath(["me"])).toBe(true);
    expect(isApiProcedurePath(["bookmarks", "list"])).toBe(true);
    expect(isApiProcedurePath(["bookmarks", "counts", "recent"])).toBe(true);
  });

  it("bookmarks の中でも web に残した title は web 行き", () => {
    expect(isApiProcedurePath(["bookmarks", "title"])).toBe(false);
  });

  it("contract に無い path・router の途中・prototype の key は web 行き", () => {
    expect(isApiProcedurePath(["auth", "session"])).toBe(false);
    expect(isApiProcedurePath(["tags"])).toBe(false);
    expect(isApiProcedurePath(["bookmarks", "counts"])).toBe(false);
    expect(isApiProcedurePath(["health", "extra"])).toBe(false);
    expect(isApiProcedurePath(["toString"])).toBe(false);
    expect(isApiProcedurePath([])).toBe(false);
  });
});

describe("createAppLink", () => {
  it("contract の procedure は api link、残りは web link へ送る", async () => {
    const calls: string[] = [];
    const client: AppClient = createORPCClient(
      createAppLink({
        api: recordingLink("api", calls),
        web: recordingLink("web", calls),
      })
    );

    await client.health();
    await client.me();
    await client.auth.session();
    await client.bookmarks.title({ url: "https://example.com/" });
    await client.bookmarks.counts.recent();

    expect(calls).toStrictEqual([
      "api:health",
      "api:me",
      "web:auth/session",
      "web:bookmarks/title",
      "api:bookmarks/counts/recent",
    ]);
  });

  it("api link を遅延生成する場合も api 行きの呼び出しでだけ解決する", async () => {
    const calls: string[] = [];
    let resolved = 0;
    const client: AppClient = createORPCClient(
      createAppLink({
        api: async () => {
          resolved += 1;
          await Promise.resolve();
          return recordingLink("api", calls);
        },
        web: recordingLink("web", calls),
      })
    );

    await client.auth.session();
    expect(resolved).toBe(0);
    await client.health();
    expect(resolved).toBe(1);
    expect(calls).toStrictEqual(["web:auth/session", "api:health"]);
  });
});
