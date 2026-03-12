import { createApp } from "../../createApp";
import { tagsApiSuggestQueryLimitDefault } from "../../generated/tags/tags.zod";
import type { TagsService } from "../../services/tags";
import { createMockDependencies, expectSpecErrorResponse } from "../helpers/mockDependencies";

describe("GET /v1/tags/suggest", () => {
  test("[TEST-INT-024] limit未指定のとき、GET /v1/tags/suggest を呼ぶと、default 10 を service に渡して 200 を返す", async () => {
    const result = {
      items: [
        {
          name: "sample",
          count: 3,
        },
      ],
    };
    const suggestTagsMock = vi.fn<TagsService["suggestTags"]>().mockResolvedValue(result);
    const app = createApp(
      createMockDependencies(
        {},
        {
          suggestTags: suggestTagsMock,
        },
      ),
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

  test("[TEST-INT-024] q=sample と limit=3 を指定したとき、GET /v1/tags/suggest を呼ぶと、limit=3 を service に渡して 200 を返す", async () => {
    const suggestTagsMock = vi.fn<TagsService["suggestTags"]>().mockResolvedValue({ items: [] });
    const app = createApp(
      createMockDependencies(
        {},
        {
          suggestTags: suggestTagsMock,
        },
      ),
    );

    const res = await app.request("/v1/tags/suggest?q=sample&limit=3");

    expect(res.status).toBe(200);
    expect(suggestTagsMock).toHaveBeenCalledTimes(1);
    expect(suggestTagsMock).toHaveBeenCalledWith({
      q: "sample",
      limit: 3,
    });
  });

  test("[TEST-INT-025] q=sample と limit=21 を指定したとき、GET /v1/tags/suggest を呼ぶと、400 INVALID_INPUT を返して service を呼ばない", async () => {
    const suggestTagsMock = vi.fn<TagsService["suggestTags"]>().mockResolvedValue({ items: [] });
    const app = createApp(
      createMockDependencies(
        {},
        {
          suggestTags: suggestTagsMock,
        },
      ),
    );

    const res = await app.request("/v1/tags/suggest?q=sample&limit=21");

    await expectSpecErrorResponse(res, 400, "INVALID_INPUT");
    expect(suggestTagsMock).not.toHaveBeenCalled();
  });

  test("[TEST-INT-027] q が trim 後に空文字になるとき、GET /v1/tags/suggest を呼ぶと、400 INVALID_INPUT を返して service を呼ばない", async () => {
    const suggestTagsMock = vi.fn<TagsService["suggestTags"]>().mockResolvedValue({ items: [] });
    const app = createApp(
      createMockDependencies(
        {},
        {
          suggestTags: suggestTagsMock,
        },
      ),
    );

    const res = await app.request("/v1/tags/suggest?q=%20%20");

    await expectSpecErrorResponse(res, 400, "INVALID_INPUT");
    expect(suggestTagsMock).not.toHaveBeenCalled();
  });

  test("[TEST-INT-027] q を指定しないとき、GET /v1/tags/suggest を呼ぶと、400 INVALID_INPUT を返して service を呼ばない", async () => {
    const suggestTagsMock = vi.fn<TagsService["suggestTags"]>().mockResolvedValue({ items: [] });
    const app = createApp(
      createMockDependencies(
        {},
        {
          suggestTags: suggestTagsMock,
        },
      ),
    );

    const res = await app.request("/v1/tags/suggest");

    await expectSpecErrorResponse(res, 400, "INVALID_INPUT");
    expect(suggestTagsMock).not.toHaveBeenCalled();
  });
});
