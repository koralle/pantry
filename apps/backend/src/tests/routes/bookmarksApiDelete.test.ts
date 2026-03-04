import { createApp } from "../../createApp";
import type { BookmarksService } from "../../services/bookmarks";
import {
  TEST_BOOKMARK_ID,
  createMockDependencies,
} from "../helpers/mockDependencies";

describe("DELETE /v1/bookmarks/:bookmarkId", () => {
  test("serviceを呼び出して204を返す", async () => {
    const deleteMock = vi
      .fn<BookmarksService["delete"]>()
      .mockResolvedValue(undefined);
    const app = createApp(createMockDependencies({ delete: deleteMock }));

    const res = await app.request(`/v1/bookmarks/${TEST_BOOKMARK_ID}`, {
      method: "DELETE",
    });

    expect(res.status).toBe(204);
    expect(await res.text()).toBe("");
    expect(deleteMock).toHaveBeenCalledTimes(1);
    expect(deleteMock).toHaveBeenCalledWith({
      bookmarkId: TEST_BOOKMARK_ID,
    });
  });

  test("不正なbookmarkIdは400でserviceが呼ばれない", async () => {
    const deleteMock = vi.fn<BookmarksService["delete"]>();
    const app = createApp(createMockDependencies({ delete: deleteMock }));

    const res = await app.request("/v1/bookmarks/not-a-uuid", {
      method: "DELETE",
    });

    expect(res.status).toBe(400);
    expect(deleteMock).not.toHaveBeenCalled();
  });
});
