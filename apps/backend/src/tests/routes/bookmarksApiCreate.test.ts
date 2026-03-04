import { createApp } from "../../createApp";
import type { BookmarksService } from "../../services/bookmarks";
import {
  createMockBookmarkDetail,
  createMockDependencies,
} from "../helpers/mockDependencies";

describe("POST /v1/bookmarks", () => {
  test("injectしたserviceの結果を201で返す", async () => {
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

  test("不正なURLは400でserviceが呼ばれない", async () => {
    const createMock = vi.fn<BookmarksService["create"]>();
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

    expect(res.status).toBe(400);
    expect(createMock).not.toHaveBeenCalled();
  });
});
