import type { AppDependencies } from "../../dependencies";
import type { BookmarksService, GetBookmarkOutput } from "../../services/bookmarks";

export const TEST_BOOKMARK_ID = "018f47a8-3f13-7cc0-8f2a-9ad0b7f6eaf1";

export const createMockBookmarkDetail = (): GetBookmarkOutput["bookmark"] => ({
  id: TEST_BOOKMARK_ID,
  url: "https://example.com",
  title: "Example bookmark",
  note: "This is a note",
  tags: ["sample"],
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
});

export const createMockDependencies = (
  overrides: Partial<BookmarksService> = {},
): AppDependencies => {
  const bookmarksService: BookmarksService = {
    list: vi.fn<BookmarksService["list"]>().mockResolvedValue({
      items: [],
      nextCursor: null,
    }),
    create: vi
      .fn<BookmarksService["create"]>()
      .mockResolvedValue({ bookmark: createMockBookmarkDetail() }),
    get: vi
      .fn<BookmarksService["get"]>()
      .mockResolvedValue({ bookmark: createMockBookmarkDetail() }),
    update: vi
      .fn<BookmarksService["update"]>()
      .mockResolvedValue({ bookmark: createMockBookmarkDetail() }),
    delete: vi.fn<BookmarksService["delete"]>().mockResolvedValue(undefined),
    suggestTags: vi
      .fn<BookmarksService["suggestTags"]>()
      .mockResolvedValue({ items: [] }),
  };

  Object.assign(bookmarksService, overrides);

  return {
    bookmarksService,
  };
};
