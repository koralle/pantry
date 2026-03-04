import { createApp } from "../../createApp";
import type { BookmarksService } from "../../services/bookmarks";
import {
  TEST_BOOKMARK_ID,
  createMockBookmarkDetail,
  createMockDependencies,
} from "../helpers/mockDependencies";

describe("PATCH /v1/bookmarks/:bookmarkId", () => {
  test("injectしたserviceの結果を返す", async () => {
    const result = {
      bookmark: createMockBookmarkDetail(),
    };
    const updateMock = vi
      .fn<BookmarksService["update"]>()
      .mockResolvedValue(result);
    const app = createApp(createMockDependencies({ update: updateMock }));
    const body = {
      title: "Updated title",
    };

    const res = await app.request(`/v1/bookmarks/${TEST_BOOKMARK_ID}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toStrictEqual(result);
    expect(updateMock).toHaveBeenCalledTimes(1);
    expect(updateMock).toHaveBeenCalledWith({
      bookmarkId: TEST_BOOKMARK_ID,
      ...body,
    });
  });

  test("不正なbodyは400でserviceが呼ばれない", async () => {
    const updateMock = vi.fn<BookmarksService["update"]>();
    const app = createApp(createMockDependencies({ update: updateMock }));

    const res = await app.request(`/v1/bookmarks/${TEST_BOOKMARK_ID}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "",
      }),
    });

    expect(res.status).toBe(400);
    expect(updateMock).not.toHaveBeenCalled();
  });
});
