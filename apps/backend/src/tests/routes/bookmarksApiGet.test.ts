import { createApp } from "../../createApp";
import type { BookmarksService } from "../../services/bookmarks";
import {
  TEST_BOOKMARK_ID,
  createMockBookmarkDetail,
  createMockDependencies,
} from "../helpers/mockDependencies";

describe("GET /v1/bookmarks/:bookmarkId", () => {
  test("injectしたserviceの結果を返す", async () => {
    const result = {
      bookmark: createMockBookmarkDetail(),
    };
    const getMock = vi.fn<BookmarksService["get"]>().mockResolvedValue(result);
    const app = createApp(createMockDependencies({ get: getMock }));

    const res = await app.request(`/v1/bookmarks/${TEST_BOOKMARK_ID}`);

    expect(res.status).toBe(200);
    expect(await res.json()).toStrictEqual(result);
    expect(getMock).toHaveBeenCalledTimes(1);
    expect(getMock).toHaveBeenCalledWith({
      bookmarkId: TEST_BOOKMARK_ID,
    });
  });

  test("不正なbookmarkIdは400でserviceが呼ばれない", async () => {
    const getMock = vi.fn<BookmarksService["get"]>();
    const app = createApp(createMockDependencies({ get: getMock }));

    const res = await app.request("/v1/bookmarks/not-a-uuid");

    expect(res.status).toBe(400);
    expect(getMock).not.toHaveBeenCalled();
  });
});
