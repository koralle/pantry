import { beforeAll, beforeEach, describe, expect, test } from "vitest";
import {
  apiRequest,
  createBookmark,
  ensureTestDatabase,
  expectJsonError,
  resetTestDatabase,
} from "../../test-support/api";

describe("tags integration", () => {
  beforeAll(async () => {
    await ensureTestDatabase();
  });

  beforeEach(async () => {
    await resetTestDatabase();
  });

  test("suggests normalized tags with prefix-first ordering and limit handling", async () => {
    await createBookmark({
      url: "https://example.com/cloudflare",
      title: "Cloudflare",
      tags: ["cloudflare", "cloud", "workers"],
    });
    await createBookmark({
      url: "https://example.com/client",
      title: "Client",
      tags: ["cloudflare", "client"],
    });
    await createBookmark({
      url: "https://example.com/extra",
      title: "Extra",
      tags: ["client"],
    });

    const response = await apiRequest("/v1/tags/suggest?q=cloud&limit=2");

    expect(response.status).toBe(200);
    expect(await response.json()).toStrictEqual({
      items: [
        { name: "cloudflare", count: 2 },
        { name: "cloud", count: 1 },
      ],
    });
  });

  test("rejects blank q and oversized limit with JSON errors", async () => {
    await expectJsonError(await apiRequest("/v1/tags/suggest?q=%20%20"), 400, "INVALID_INPUT");
    await expectJsonError(await apiRequest("/v1/tags/suggest?q=cl&limit=21"), 400, "INVALID_INPUT");
  });
});
