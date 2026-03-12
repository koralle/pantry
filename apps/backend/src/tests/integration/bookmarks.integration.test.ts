import { beforeAll, beforeEach, describe, expect, test } from "vitest";
import {
  apiRequest,
  createBookmark,
  ensureTestDatabase,
  expectJsonError,
  expectUuidV7,
  resetTestDatabase,
} from "../../test-support/api";

describe("bookmarks integration", () => {
  beforeAll(async () => {
    await ensureTestDatabase();
  });

  beforeEach(async () => {
    await resetTestDatabase();
  });

  test("creates a bookmark, normalizes tags, falls back title to normalized url, and loads it by id", async () => {
    const created = await createBookmark({
      url: " HTTPS://Example.com:443/articles/test/#section ",
      tags: [" Cloudflare ", "cloudflare", "Workers"],
    });

    expectUuidV7(created.id);
    expect(created.url).toBe("https://example.com/articles/test");
    expect(created.title).toBe("https://example.com/articles/test");
    expect(created.tags).toStrictEqual(["cloudflare", "workers"]);
    expect(created.createdAt).toMatch(/Z$/);
    expect(created.updatedAt).toMatch(/Z$/);

    const response = await apiRequest(`/v1/bookmarks/${created.id}`);

    expect(response.status).toBe(200);
    expect(await response.json()).toStrictEqual({
      bookmark: created,
    });
  });

  test("lists bookmarks with q search, tag filtering, and nextCursor=null", async () => {
    const cloudflare = await createBookmark({
      url: "https://example.com/cloudflare",
      title: "Cloudflare Workers",
      note: "edge compute",
      tags: ["cloudflare", "workers"],
    });
    await createBookmark({
      url: "https://example.com/typespec",
      title: "TypeSpec",
      note: "contract first",
      tags: ["api", "schema"],
    });
    const workers = await createBookmark({
      url: "https://workers.dev/reference",
      title: "Runtime reference",
      note: "Cloudflare runtime",
      tags: ["cloudflare", "runtime"],
    });

    const searchResponse = await apiRequest("/v1/bookmarks?q=runtime");

    expect(searchResponse.status).toBe(200);
    expect(await searchResponse.json()).toStrictEqual({
      items: [workers],
      nextCursor: null,
    });

    const andResponse = await apiRequest("/v1/bookmarks?tags=cloudflare&tags=workers&tagMode=and");

    expect(andResponse.status).toBe(200);
    expect(await andResponse.json()).toStrictEqual({
      items: [cloudflare],
      nextCursor: null,
    });

    const orResponse = await apiRequest("/v1/bookmarks?tags=workers&tags=runtime&tagMode=or");

    expect(orResponse.status).toBe(200);
    expect(await orResponse.json()).toStrictEqual({
      items: [workers, cloudflare],
      nextCursor: null,
    });
  });

  test("updates note and tags, supports note:null, and sorts by updated", async () => {
    const older = await createBookmark({
      url: "https://example.com/older",
      title: "Older",
      note: "keep me",
      tags: ["legacy"],
    });
    const newer = await createBookmark({
      url: "https://example.com/newer",
      title: "Newer",
      tags: ["fresh"],
    });

    const patchResponse = await apiRequest(`/v1/bookmarks/${older.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        note: null,
        tags: ["Cloudflare", "updated"],
      }),
    });

    expect(patchResponse.status).toBe(200);
    const patched = (await patchResponse.json()) as {
      bookmark: {
        id: string;
        url: string;
        title: string;
        note?: string;
        tags: string[];
        createdAt: string;
        updatedAt: string;
      };
    };
    expect(patched.bookmark).toMatchObject({
      id: older.id,
      tags: ["cloudflare", "updated"],
    });
    expect("note" in patched.bookmark).toBe(false);

    const updatedListResponse = await apiRequest("/v1/bookmarks?sort=updated");

    expect(updatedListResponse.status).toBe(200);
    expect(await updatedListResponse.json()).toStrictEqual({
      items: [patched.bookmark, newer],
      nextCursor: null,
    });
  });

  test("returns URL_CONFLICT for normalized duplicates, soft deletes, and allows re-create after delete", async () => {
    const created = await createBookmark({
      url: "https://example.com/duplicate/",
      title: "Original",
    });

    const conflictResponse = await apiRequest("/v1/bookmarks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: " https://EXAMPLE.com/duplicate#fragment ",
        title: "Duplicate",
      }),
    });

    await expectJsonError(conflictResponse, 409, "URL_CONFLICT");

    const deleteResponse = await apiRequest(`/v1/bookmarks/${created.id}`, {
      method: "DELETE",
    });

    expect(deleteResponse.status).toBe(204);
    expect(await deleteResponse.text()).toBe("");

    await expectJsonError(await apiRequest(`/v1/bookmarks/${created.id}`), 404, "NOT_FOUND");

    const listResponse = await apiRequest("/v1/bookmarks");

    expect(listResponse.status).toBe(200);
    expect(await listResponse.json()).toStrictEqual({
      items: [],
      nextCursor: null,
    });

    const recreated = await createBookmark({
      url: "https://example.com/duplicate",
      title: "Recreated",
    });

    expect(recreated.title).toBe("Recreated");
  });

  test("returns JSON errors for invalid input and unsupported cursor", async () => {
    await expectJsonError(
      await apiRequest("/v1/bookmarks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: "not-a-url",
        }),
      }),
      400,
      "INVALID_INPUT",
    );

    await expectJsonError(await apiRequest("/v1/bookmarks?cursor=opaque"), 400, "INVALID_CURSOR");
  });
});
