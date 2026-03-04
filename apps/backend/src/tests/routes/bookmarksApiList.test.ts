import { createApp } from "../../createApp";
import type { BookmarksService } from "../../services/bookmarks";

describe("/v1/bookmarks", () => {
  test("injectしたserviceの結果を返す", async () => {
    const listMock: BookmarksService["list"] = vi.fn().mockResolvedValue({
      items: [],
      nextCursor: null,
    });

    const app = createApp({
      bookmarksService: {
        list: listMock,
      },
    });

    const res = await app.request("/v1/bookmarks");

    expect(res.status).toBe(200);
    expect(await res.json()).toStrictEqual({
      items: [],
      nextCursor: null,
    });
  });
});
