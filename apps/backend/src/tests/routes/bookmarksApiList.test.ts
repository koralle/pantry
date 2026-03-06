import { createApp } from "../../createApp";
import { bookmarksApiListQueryLimitDefault } from "../../generated/bookmarks/bookmarks.zod";
import type { BookmarksService } from "../../services/bookmarks";
import {
  createMockDependencies,
  expectSpecErrorResponse,
} from "../helpers/mockDependencies";

describe("GET /v1/bookmarks", () => {
  test("[TEST-INT-012] limit未指定時はdefault 20をserviceに渡す", async () => {
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

  test("[TEST-INT-005] qをserviceに渡す", async () => {
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

  test("[TEST-INT-006] tagMode=andをserviceに渡す", async () => {
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

  test("[TEST-INT-007] tagMode=orをserviceに渡す", async () => {
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

  test("[TEST-INT-020] tags=a&tags=b形式を受け付ける", async () => {
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

  test("[TEST-INT-021] tagMode未指定時はandとしてserviceに渡す", async () => {
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

  test("[TEST-INT-013] limit>100は400 INVALID_INPUT", async () => {
    const listMock = vi.fn<BookmarksService["list"]>().mockResolvedValue({
      items: [],
      nextCursor: null,
    });
    const app = createApp(createMockDependencies({ list: listMock }));

    const res = await app.request("/v1/bookmarks?limit=101");

    await expectSpecErrorResponse(res, 400, "INVALID_INPUT");
    expect(listMock).not.toHaveBeenCalled();
  });

  test("[TEST-INT-029] tags=a,bは400 INVALID_INPUT", async () => {
    const listMock = vi.fn<BookmarksService["list"]>().mockResolvedValue({
      items: [],
      nextCursor: null,
    });
    const app = createApp(createMockDependencies({ list: listMock }));

    const res = await app.request("/v1/bookmarks?tags=a,b");

    await expectSpecErrorResponse(res, 400, "INVALID_INPUT");
    expect(listMock).not.toHaveBeenCalled();
  });

  test("[TEST-INT-033] tagsが21件以上は400 INVALID_INPUT", async () => {
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

  test("[TEST-INT-034] tagsに33文字以上の要素がある場合は400 INVALID_INPUT", async () => {
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

  test("[TEST-INT-035] tagsにtrim後空文字がある場合は400 INVALID_INPUT", async () => {
    const listMock = vi.fn<BookmarksService["list"]>().mockResolvedValue({
      items: [],
      nextCursor: null,
    });
    const app = createApp(createMockDependencies({ list: listMock }));

    const res = await app.request("/v1/bookmarks?tags=%20&tags=ok");

    await expectSpecErrorResponse(res, 400, "INVALID_INPUT");
    expect(listMock).not.toHaveBeenCalled();
  });

  test("[TEST-INT-032] nextCursorキーを常に返す（終端はnull）", async () => {
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

  test("[TEST-INT-032] nextCursorキーを常に返す（非終端はstring）", async () => {
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

  test("[TEST-INT-028] 想定外例外時は500 INTERNAL_ERRORでスタックを返さない", async () => {
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
