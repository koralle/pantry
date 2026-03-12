import {
  toCreateBookmarkApiResponse,
  toCreateBookmarkServiceInput,
  toDeleteBookmarkServiceInput,
  toGetBookmarkApiResponse,
  toListBookmarksApiResponse,
  toListBookmarksServiceInput,
  toUpdateBookmarkApiResponse,
  toUpdateBookmarkServiceInput,
} from "../../routes/bookmarks.mapper";
import type {
  CreateBookmarkOutput,
  GetBookmarkOutput,
  ListBookmarksOutput,
  UpdateBookmarkOutput,
} from "../../services/bookmarks";

describe("bookmarks mapper", () => {
  test("toListBookmarksServiceInput applies defaultLimit", () => {
    const result = toListBookmarksServiceInput({}, 20);

    expect(result).toStrictEqual({
      limit: 20,
    });
  });

  test("toCreateBookmarkServiceInput omits undefined properties", () => {
    const body = {
      url: "https://example.com",
      title: undefined,
      note: undefined,
      tags: undefined,
    } as unknown as Parameters<typeof toCreateBookmarkServiceInput>[0];
    const result = toCreateBookmarkServiceInput(body);

    expect(result).toStrictEqual({
      url: "https://example.com",
    });
    expect(Object.hasOwn(result, "title")).toBe(false);
    expect(Object.hasOwn(result, "note")).toBe(false);
    expect(Object.hasOwn(result, "tags")).toBe(false);
  });

  test("toUpdateBookmarkServiceInput keeps note:null and omits undefined properties", () => {
    const body = {
      title: undefined,
      note: null,
      tags: undefined,
    } as unknown as Parameters<typeof toUpdateBookmarkServiceInput>[1];
    const result = toUpdateBookmarkServiceInput(
      { bookmarkId: "018f47a8-3f13-7cc0-8f2a-9ad0b7f6eaf1" },
      body,
    );

    expect(result).toStrictEqual({
      bookmarkId: "018f47a8-3f13-7cc0-8f2a-9ad0b7f6eaf1",
      note: null,
    });
    expect(Object.hasOwn(result, "title")).toBe(false);
    expect(Object.hasOwn(result, "tags")).toBe(false);
  });

  test("to*ApiResponse omits note when undefined", () => {
    const bookmark = {
      id: "018f47a8-3f13-7cc0-8f2a-9ad0b7f6eaf1",
      url: "https://example.com",
      title: "Example bookmark",
      tags: ["sample"],
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    };
    const listResult: ListBookmarksOutput = {
      items: [bookmark],
      nextCursor: null,
    };
    const createResult: CreateBookmarkOutput = { bookmark };
    const getResult: GetBookmarkOutput = { bookmark };
    const updateResult: UpdateBookmarkOutput = { bookmark };

    const listResponse = toListBookmarksApiResponse(listResult);
    const createResponse = toCreateBookmarkApiResponse(createResult);
    const getResponse = toGetBookmarkApiResponse(getResult);
    const updateResponse = toUpdateBookmarkApiResponse(updateResult);

    expect(Object.hasOwn(listResponse.items[0], "note")).toBe(false);
    expect(Object.hasOwn(createResponse.bookmark, "note")).toBe(false);
    expect(Object.hasOwn(getResponse.bookmark, "note")).toBe(false);
    expect(Object.hasOwn(updateResponse.bookmark, "note")).toBe(false);
  });

  test("toDeleteBookmarkServiceInput maps bookmarkId", () => {
    const result = toDeleteBookmarkServiceInput({
      bookmarkId: "018f47a8-3f13-7cc0-8f2a-9ad0b7f6eaf1",
    });

    expect(result).toStrictEqual({
      bookmarkId: "018f47a8-3f13-7cc0-8f2a-9ad0b7f6eaf1",
    });
  });
});
