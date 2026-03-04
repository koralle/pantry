import { createApp } from "../../createApp";
import { bookmarksApiListQueryLimitDefault } from "../../generated/bookmarks/bookmarks.zod";
import type { BookmarksService } from "../../services/bookmarks";
import { createMockDependencies } from "../helpers/mockDependencies";

describe("/v1/bookmarks", () => {
  test("injectしたserviceの結果を返す", async () => {
    const listMock = vi.fn<BookmarksService["list"]>().mockResolvedValue({
      items: [],
      nextCursor: null,
    });

    const app = createApp(createMockDependencies({ list: listMock }));

    const res = await app.request("/v1/bookmarks");

    expect(res.status).toBe(200);
    expect(await res.json()).toStrictEqual({
      items: [],
      nextCursor: null,
    });
    expect(listMock).toHaveBeenCalledTimes(1);
    expect(listMock).toHaveBeenCalledWith({
      limit: bookmarksApiListQueryLimitDefault,
    });
  });
});
