import { createApp } from "../../createApp";
import { HTTPException } from "hono/http-exception";
import type { BookmarksService } from "../../services/bookmarks";
import {
  TEST_BOOKMARK_ID,
  createMockDependencies,
  expectSpecErrorResponse,
} from "../helpers/mockDependencies";

describe("DELETE /v1/bookmarks/:bookmarkId", () => {
  test("[TEST-INT-023] serviceを呼び出して204を返す", async () => {
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

  test("[TEST-INT-023] 不正なbookmarkIdは400 INVALID_INPUTでserviceが呼ばれない", async () => {
    const deleteMock = vi
      .fn<BookmarksService["delete"]>()
      .mockResolvedValue(undefined);
    const app = createApp(createMockDependencies({ delete: deleteMock }));

    const res = await app.request("/v1/bookmarks/not-a-uuid", {
      method: "DELETE",
    });

    await expectSpecErrorResponse(res, 400, "INVALID_INPUT");
    expect(deleteMock).not.toHaveBeenCalled();
  });

  test("[TEST-INT-023] ブックマーク未存在時は404 NOT_FOUNDを返す", async () => {
    const deleteMock = vi.fn<BookmarksService["delete"]>().mockImplementation(() => {
      throw new HTTPException(404, {
        message: "NOT_FOUND",
      });
    });
    const app = createApp(createMockDependencies({ delete: deleteMock }));

    const res = await app.request(`/v1/bookmarks/${TEST_BOOKMARK_ID}`, {
      method: "DELETE",
    });

    await expectSpecErrorResponse(res, 404, "NOT_FOUND");
    expect(deleteMock).toHaveBeenCalledTimes(1);
    expect(deleteMock).toHaveBeenCalledWith({
      bookmarkId: TEST_BOOKMARK_ID,
    });
  });
});
