import { createApp } from "../../createApp";
import { HTTPException } from "hono/http-exception";
import type { BookmarksService } from "../../services/bookmarks";
import {
  TEST_BOOKMARK_ID,
  createMockBookmarkDetail,
  createMockDependencies,
  expectSpecErrorResponse,
} from "../helpers/mockDependencies";

describe("PATCH /v1/bookmarks/:bookmarkId", () => {
  test(
    "[TEST-INT-004] note: null を含む body を指定したとき、PATCH /v1/bookmarks/:bookmarkId を呼ぶと、note: null を service に渡して 200 を返す",
    async () => {
      const result = {
        bookmark: createMockBookmarkDetail(),
      };
      const updateMock = vi
        .fn<BookmarksService["update"]>()
        .mockResolvedValue(result);
      const app = createApp(createMockDependencies({ update: updateMock }));
      const body = {
        note: null,
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
        note: null,
      });
    },
  );

  test(
    "[TEST-INT-004] 不正な body を指定したとき、PATCH /v1/bookmarks/:bookmarkId を呼ぶと、400 INVALID_INPUT を返して service を呼ばない",
    async () => {
      const updateMock = vi
        .fn<BookmarksService["update"]>()
        .mockResolvedValue({ bookmark: createMockBookmarkDetail() });
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

      await expectSpecErrorResponse(res, 400, "INVALID_INPUT");
      expect(updateMock).not.toHaveBeenCalled();
    },
  );

  test(
    "[TEST-INT-003] service が URL_CONFLICT を返すとき、PATCH /v1/bookmarks/:bookmarkId を呼ぶと、409 URL_CONFLICT を返す",
    async () => {
      const updateMock = vi.fn<BookmarksService["update"]>().mockImplementation(() => {
        throw new HTTPException(409, {
          message: "URL_CONFLICT",
        });
      });
      const app = createApp(createMockDependencies({ update: updateMock }));

      const res = await app.request(`/v1/bookmarks/${TEST_BOOKMARK_ID}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: "https://example.com",
        }),
      });

      await expectSpecErrorResponse(res, 409, "URL_CONFLICT");
      expect(updateMock).toHaveBeenCalledTimes(1);
      expect(updateMock).toHaveBeenCalledWith({
        bookmarkId: TEST_BOOKMARK_ID,
        url: "https://example.com",
      });
    },
  );
});
