import { afterEach, describe, expect, test, vi } from "vitest";

import { apiBrowserClient } from "./client";

describe("apiBrowserClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("同一 origin の /rpc へ fetch し、api を戻しても動くよう x-csrf-token を付ける", async () => {
    const requests: Request[] = [];
    vi.stubGlobal("location", new URL("https://pantry.example.com/bookmarks"));
    vi.stubGlobal("fetch", async (request: Request) => {
      requests.push(request);
      return await Promise.resolve(
        Response.json({ json: { status: "ok" } }, { status: 200 })
      );
    });

    await expect(apiBrowserClient.health()).resolves.toStrictEqual({
      status: "ok",
    });
    expect(requests[0]?.url).toBe("https://pantry.example.com/rpc/health");
    expect(requests[0]?.headers.get("x-csrf-token")).toBe("orpc");
  });
});
