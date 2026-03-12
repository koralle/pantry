import { createApp } from "../../createApp";
import { bookmarksApiListQueryLimitDefault } from "../../generated/bookmarks/bookmarks.zod";
import type { BookmarksService } from "../../services/bookmarks";
import { createMockDependencies, expectSpecErrorResponse } from "../helpers/mockDependencies";

describe("GET /v1/bookmarks", () => {
  test("[TEST-INT-012] limit未指定のとき、GET /v1/bookmarks を呼ぶと、default 20 を service に渡して 200 を返す", async () => {
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

  test("[TEST-INT-005] q=example を指定したとき、GET /v1/bookmarks を呼ぶと、q を service に渡して 200 を返す", async () => {
    const listMock = vi.fn<BookmarksService["list"]>().mockResolvedValue({
      items: [],
      nextCursor: null,
    });
    const app = createApp(createMockDependencies({ list: listMock }));

    const res = await app.request("/v1/bookmarks?q=example");

    expect(res.status).toBe(200);
    expect(listMock).toHaveBeenCalledTimes(1);
    expect(listMock).toHaveBeenCalledWith({
      q: "example",
      limit: bookmarksApiListQueryLimitDefault,
    });
  });

  test("[TEST-INT-006] tags=a&tags=b と tagMode=and を指定したとき、GET /v1/bookmarks を呼ぶと、tags と tagMode=and を service に渡して 200 を返す", async () => {
    const listMock = vi.fn<BookmarksService["list"]>().mockResolvedValue({
      items: [],
      nextCursor: null,
    });
    const app = createApp(createMockDependencies({ list: listMock }));

    const res = await app.request("/v1/bookmarks?tags=a&tags=b&tagMode=and");

    expect(res.status).toBe(200);
    expect(listMock).toHaveBeenCalledTimes(1);
    expect(listMock).toHaveBeenCalledWith({
      tags: ["a", "b"],
      tagMode: "and",
      limit: bookmarksApiListQueryLimitDefault,
    });
  });

  test("[TEST-INT-007] tags=a&tags=b と tagMode=or を指定したとき、GET /v1/bookmarks を呼ぶと、tags と tagMode=or を service に渡して 200 を返す", async () => {
    const listMock = vi.fn<BookmarksService["list"]>().mockResolvedValue({
      items: [],
      nextCursor: null,
    });
    const app = createApp(createMockDependencies({ list: listMock }));

    const res = await app.request("/v1/bookmarks?tags=a&tags=b&tagMode=or");

    expect(res.status).toBe(200);
    expect(listMock).toHaveBeenCalledTimes(1);
    expect(listMock).toHaveBeenCalledWith({
      tags: ["a", "b"],
      tagMode: "or",
      limit: bookmarksApiListQueryLimitDefault,
    });
  });

  test("[TEST-INT-020] tags を繰り返し形式で指定したとき、GET /v1/bookmarks を呼ぶと、tags を配列として service に渡して 200 を返す", async () => {
    const listMock = vi.fn<BookmarksService["list"]>().mockResolvedValue({
      items: [],
      nextCursor: null,
    });
    const app = createApp(createMockDependencies({ list: listMock }));

    const res = await app.request("/v1/bookmarks?tags=a&tags=b");

    expect(res.status).toBe(200);
    expect(listMock).toHaveBeenCalledTimes(1);
    expect(listMock).toHaveBeenCalledWith({
      tags: ["a", "b"],
      limit: bookmarksApiListQueryLimitDefault,
    });
  });

  test("[TEST-INT-021] tags を指定して tagMode を省略したとき、GET /v1/bookmarks を呼ぶと、tagMode=and を service に渡して 200 を返す", async () => {
    const listMock = vi.fn<BookmarksService["list"]>().mockResolvedValue({
      items: [],
      nextCursor: null,
    });
    const app = createApp(createMockDependencies({ list: listMock }));

    const res = await app.request("/v1/bookmarks?tags=a&tags=b");

    expect(res.status).toBe(200);
    expect(listMock).toHaveBeenCalledTimes(1);
    expect(listMock).toHaveBeenCalledWith({
      tags: ["a", "b"],
      tagMode: "and",
      limit: bookmarksApiListQueryLimitDefault,
    });
  });

  test("[TEST-INT-013] limit=101 を指定したとき、GET /v1/bookmarks を呼ぶと、400 INVALID_INPUT を返して service を呼ばない", async () => {
    const listMock = vi.fn<BookmarksService["list"]>().mockResolvedValue({
      items: [],
      nextCursor: null,
    });
    const app = createApp(createMockDependencies({ list: listMock }));

    const res = await app.request("/v1/bookmarks?limit=101");

    await expectSpecErrorResponse(res, 400, "INVALID_INPUT");
    expect(listMock).not.toHaveBeenCalled();
  });

  test("[TEST-INT-029] tags を CSV 形式で指定したとき、GET /v1/bookmarks を呼ぶと、400 INVALID_INPUT を返して service を呼ばない", async () => {
    const listMock = vi.fn<BookmarksService["list"]>().mockResolvedValue({
      items: [],
      nextCursor: null,
    });
    const app = createApp(createMockDependencies({ list: listMock }));

    const res = await app.request("/v1/bookmarks?tags=a,b");

    await expectSpecErrorResponse(res, 400, "INVALID_INPUT");
    expect(listMock).not.toHaveBeenCalled();
  });

  test("[TEST-INT-033] tags を 21 件指定したとき、GET /v1/bookmarks を呼ぶと、400 INVALID_INPUT を返して service を呼ばない", async () => {
    const listMock = vi.fn<BookmarksService["list"]>().mockResolvedValue({
      items: [],
      nextCursor: null,
    });
    const app = createApp(createMockDependencies({ list: listMock }));
    const params = new URLSearchParams();
    for (let i = 0; i < 21; i += 1) {
      params.append("tags", `tag${i}`);
    }

    const res = await app.request(`/v1/bookmarks?${params.toString()}`);

    await expectSpecErrorResponse(res, 400, "INVALID_INPUT");
    expect(listMock).not.toHaveBeenCalled();
  });

  test("[TEST-INT-034] 33 文字以上の tag を含めたとき、GET /v1/bookmarks を呼ぶと、400 INVALID_INPUT を返して service を呼ばない", async () => {
    const listMock = vi.fn<BookmarksService["list"]>().mockResolvedValue({
      items: [],
      nextCursor: null,
    });
    const app = createApp(createMockDependencies({ list: listMock }));
    const longTag = "x".repeat(33);

    const res = await app.request(`/v1/bookmarks?tags=${longTag}&tags=ok`);

    await expectSpecErrorResponse(res, 400, "INVALID_INPUT");
    expect(listMock).not.toHaveBeenCalled();
  });

  test("[TEST-INT-035] trim 後に空文字になる tag を含めたとき、GET /v1/bookmarks を呼ぶと、400 INVALID_INPUT を返して service を呼ばない", async () => {
    const listMock = vi.fn<BookmarksService["list"]>().mockResolvedValue({
      items: [],
      nextCursor: null,
    });
    const app = createApp(createMockDependencies({ list: listMock }));

    const res = await app.request("/v1/bookmarks?tags=%20&tags=ok");

    await expectSpecErrorResponse(res, 400, "INVALID_INPUT");
    expect(listMock).not.toHaveBeenCalled();
  });

  test("[TEST-INT-032] service が nextCursor=null を返すとき、GET /v1/bookmarks を呼ぶと、レスポンスに nextCursor キーを含めて 200 を返す", async () => {
    const listMock = vi.fn<BookmarksService["list"]>().mockResolvedValue({
      items: [],
      nextCursor: null,
    });
    const app = createApp(createMockDependencies({ list: listMock }));

    const res = await app.request("/v1/bookmarks");
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveProperty("nextCursor");
    // expect(body.nextCursor).toBeNull();
  });

  test("[TEST-INT-032] service が nextCursor に文字列を返すとき、GET /v1/bookmarks を呼ぶと、レスポンスに nextCursor キーを含めて 200 を返す", async () => {
    const listMock = vi.fn<BookmarksService["list"]>().mockResolvedValue({
      items: [],
      nextCursor: "opaque-cursor",
    });
    const app = createApp(createMockDependencies({ list: listMock }));

    const res = await app.request("/v1/bookmarks");
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveProperty("nextCursor");
    // expect(body.nextCursor).toBeTypeOf("string");
  });

  test("[TEST-INT-028] service が想定外例外を投げるとき、GET /v1/bookmarks を呼ぶと、500 INTERNAL_ERROR を返しスタックを含めない", async () => {
    const listMock = vi
      .fn<BookmarksService["list"]>()
      .mockRejectedValue(new Error("unexpected boom"));
    const app = createApp(createMockDependencies({ list: listMock }));

    const res = await app.request("/v1/bookmarks");
    const responseText = await res.text();

    expect(res.status).toBe(500);
    expect(res.headers.get("content-type")).toContain("application/json");
    expect(() => JSON.parse(responseText)).not.toThrow();

    const body = JSON.parse(responseText);
    expect(body).toMatchObject({
      error: {
        code: "INTERNAL_ERROR",
      },
    });
    expect(responseText).not.toContain("unexpected boom");
    expect(responseText).not.toContain("stack");
  });
});
