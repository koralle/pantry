import { createApp } from "../../createApp";
import { HTTPException } from "hono/http-exception";
import type { BookmarksService } from "../../services/bookmarks";
import {
  createMockBookmarkDetail,
  createMockDependencies,
  expectSpecErrorResponse,
} from "../helpers/mockDependencies";

describe("POST /v1/bookmarks", () => {
  test("[TEST-INT-001] 入力をserviceへ渡して201を返す", async () => {
    const result = {
      bookmark: createMockBookmarkDetail(),
    };
    const createMock = vi
      .fn<BookmarksService["create"]>()
      .mockResolvedValue(result);
    const app = createApp(createMockDependencies({ create: createMock }));
    const body = {
      url: "https://example.com",
      title: "Example bookmark",
      note: "memo",
      tags: ["sample", "backend"],
    };

    const res = await app.request("/v1/bookmarks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    expect(res.status).toBe(201);
    expect(await res.json()).toStrictEqual(result);
    expect(createMock).toHaveBeenCalledTimes(1);
    expect(createMock).toHaveBeenCalledWith(body);
  });

  test("[TEST-INT-003] URL重複時は409 URL_CONFLICTを返す", async () => {
    const createMock = vi.fn<BookmarksService["create"]>().mockImplementation(() => {
      throw new HTTPException(409, {
        message: "URL_CONFLICT",
      });
    });
    const app = createApp(createMockDependencies({ create: createMock }));

    const res = await app.request("/v1/bookmarks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: "https://example.com",
      }),
    });

    await expectSpecErrorResponse(res, 409, "URL_CONFLICT");
    expect(createMock).toHaveBeenCalledTimes(1);
  });

  test("[TEST-INT-001] 不正なURLは400 INVALID_INPUTでserviceが呼ばれない", async () => {
    const createMock = vi
      .fn<BookmarksService["create"]>()
      .mockResolvedValue({ bookmark: createMockBookmarkDetail() });
    const app = createApp(createMockDependencies({ create: createMock }));

    const res = await app.request("/v1/bookmarks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: "not-a-url",
      }),
    });

    await expectSpecErrorResponse(res, 400, "INVALID_INPUT");
    expect(createMock).not.toHaveBeenCalled();
  });

  test("[TEST-INT-001] tagsが21件以上は400 INVALID_INPUTでserviceが呼ばれない", async () => {
    const createMock = vi
      .fn<BookmarksService["create"]>()
      .mockResolvedValue({ bookmark: createMockBookmarkDetail() });
    const app = createApp(createMockDependencies({ create: createMock }));

    const res = await app.request("/v1/bookmarks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: "https://example.com",
        tags: Array.from({ length: 21 }, (_, i) => `tag${i}`),
      }),
    });

    await expectSpecErrorResponse(res, 400, "INVALID_INPUT");
    expect(createMock).not.toHaveBeenCalled();
  });

  test("[TEST-INT-001] tagsに33文字以上がある場合は400 INVALID_INPUTでserviceが呼ばれない", async () => {
    const createMock = vi
      .fn<BookmarksService["create"]>()
      .mockResolvedValue({ bookmark: createMockBookmarkDetail() });
    const app = createApp(createMockDependencies({ create: createMock }));

    const res = await app.request("/v1/bookmarks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: "https://example.com",
        tags: ["x".repeat(33)],
      }),
    });

    await expectSpecErrorResponse(res, 400, "INVALID_INPUT");
    expect(createMock).not.toHaveBeenCalled();
  });

  test("[TEST-INT-001] tagsに空文字がある場合は400 INVALID_INPUTでserviceが呼ばれない", async () => {
    const createMock = vi
      .fn<BookmarksService["create"]>()
      .mockResolvedValue({ bookmark: createMockBookmarkDetail() });
    const app = createApp(createMockDependencies({ create: createMock }));

    const res = await app.request("/v1/bookmarks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: "https://example.com",
        tags: [""],
      }),
    });

    await expectSpecErrorResponse(res, 400, "INVALID_INPUT");
    expect(createMock).not.toHaveBeenCalled();
  });
});
