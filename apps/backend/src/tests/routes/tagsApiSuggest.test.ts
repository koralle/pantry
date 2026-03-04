import { createApp } from "../../createApp";
import { tagsApiSuggestQueryLimitDefault } from "../../generated/tags/tags.zod";
import type { BookmarksService } from "../../services/bookmarks";
import { createMockDependencies } from "../helpers/mockDependencies";

describe("GET /v1/tags/suggest", () => {
  test("injectしたserviceの結果を返す", async () => {
    const result = {
      items: [
        {
          name: "sample",
          count: 3,
        },
      ],
    };
    const suggestTagsMock = vi
      .fn<BookmarksService["suggestTags"]>()
      .mockResolvedValue(result);
    const app = createApp(
      createMockDependencies({
        suggestTags: suggestTagsMock,
      }),
    );

    const res = await app.request("/v1/tags/suggest?q=sample");

    expect(res.status).toBe(200);
    expect(await res.json()).toStrictEqual(result);
    expect(suggestTagsMock).toHaveBeenCalledTimes(1);
    expect(suggestTagsMock).toHaveBeenCalledWith({
      q: "sample",
      limit: tagsApiSuggestQueryLimitDefault,
    });
  });

  test("q未指定は400でserviceが呼ばれない", async () => {
    const suggestTagsMock = vi.fn<BookmarksService["suggestTags"]>();
    const app = createApp(
      createMockDependencies({
        suggestTags: suggestTagsMock,
      }),
    );

    const res = await app.request("/v1/tags/suggest");

    expect(res.status).toBe(400);
    expect(suggestTagsMock).not.toHaveBeenCalled();
  });
});
