import { createApp } from "../../createApp";
import { HTTPException } from "hono/http-exception";
import type { BookmarksService } from "../../services/bookmarks";
import {
  TEST_BOOKMARK_ID,
  createMockBookmarkDetail,
  createMockDependencies,
  expectSpecErrorResponse,
} from "../helpers/mockDependencies";

describe("GET /v1/bookmarks/:bookmarkId", () => {
  test("[TEST-INT-001] service結果を返す", async () => {
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

  test("[TEST-INT-001] 不正なbookmarkIdは400 INVALID_INPUTでserviceが呼ばれない", async () => {
    const getMock = vi
      .fn<BookmarksService["get"]>()
      .mockResolvedValue({ bookmark: createMockBookmarkDetail() });
    const app = createApp(createMockDependencies({ get: getMock }));

    const res = await app.request("/v1/bookmarks/not-a-uuid");

    await expectSpecErrorResponse(res, 400, "INVALID_INPUT");
    expect(getMock).not.toHaveBeenCalled();
  });

  test("[TEST-INT-001] ブックマーク未存在時は404 NOT_FOUNDを返す", async () => {
    const getMock = vi.fn<BookmarksService["get"]>().mockImplementation(() => {
      throw new HTTPException(404, {
        message: "NOT_FOUND",
      });
    });
    const app = createApp(createMockDependencies({ get: getMock }));

    const res = await app.request(`/v1/bookmarks/${TEST_BOOKMARK_ID}`);

    await expectSpecErrorResponse(res, 404, "NOT_FOUND");
    expect(getMock).toHaveBeenCalledTimes(1);
    expect(getMock).toHaveBeenCalledWith({
      bookmarkId: TEST_BOOKMARK_ID,
    });
  });
});
