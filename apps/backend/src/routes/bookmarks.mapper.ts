import type {
  BookmarkDetail,
  BookmarkSummary,
  CreateBookmarkCreated,
  GetBookmarkOk,
  ListBookmarksOk,
  UpdateBookmarkOk,
} from "../generated/schemas";
import type {
  CreateBookmarkInput,
  CreateBookmarkOutput,
  DeleteBookmarkInput,
  GetBookmarkInput,
  GetBookmarkOutput,
  ListBookmarksInput,
  ListBookmarksOutput,
  UpdateBookmarkInput,
  UpdateBookmarkOutput,
} from "../services/bookmarks";
import type { BookmarkDetailDto, BookmarkSummaryDto } from "../services/bookmarks.dto";

const withDefined = <Key extends string, Value>(
  key: Key,
  value: Value | undefined,
): Partial<Record<Key, Value>> => {
  if (value === undefined) {
    return {};
  }

  return { [key]: value } as Record<Key, Value>;
};

const mapBookmarkSummary = (bookmark: BookmarkSummaryDto): BookmarkSummary => ({
  id: bookmark.id,
  url: bookmark.url,
  title: bookmark.title,
  ...withDefined("note", bookmark.note),
  tags: bookmark.tags,
  createdAt: bookmark.createdAt,
  updatedAt: bookmark.updatedAt,
});

const mapBookmarkDetail = (bookmark: BookmarkDetailDto): BookmarkDetail => ({
  id: bookmark.id,
  url: bookmark.url,
  title: bookmark.title,
  ...withDefined("note", bookmark.note),
  tags: bookmark.tags,
  createdAt: bookmark.createdAt,
  updatedAt: bookmark.updatedAt,
});

export const toListBookmarksServiceInput = (
  query: {
    q?: string | undefined;
    tags?: string[] | undefined;
    tagMode?: "and" | "or" | undefined;
    sort?: "newest" | "updated" | undefined;
    limit?: number | undefined;
    cursor?: string | undefined;
  },
  defaultLimit: number,
): ListBookmarksInput => ({
  limit: query.limit ?? defaultLimit,
  ...withDefined("q", query.q),
  ...withDefined("tags", query.tags),
  ...withDefined("tagMode", query.tagMode),
  ...withDefined("sort", query.sort),
  ...withDefined("cursor", query.cursor),
});

export const toCreateBookmarkServiceInput = (body: {
  url: string;
  title?: string | undefined;
  note?: string | undefined;
  tags?: string[] | undefined;
}): CreateBookmarkInput => ({
  url: body.url,
  ...withDefined("title", body.title),
  ...withDefined("note", body.note),
  ...withDefined("tags", body.tags),
});

export const toGetBookmarkServiceInput = (params: { bookmarkId: string }): GetBookmarkInput => ({
  bookmarkId: params.bookmarkId,
});

export const toUpdateBookmarkServiceInput = (
  params: { bookmarkId: string },
  body: {
    url?: string | undefined;
    title?: string | undefined;
    note?: string | null | undefined;
    tags?: string[] | undefined;
  },
): UpdateBookmarkInput => ({
  bookmarkId: params.bookmarkId,
  ...withDefined("url", body.url),
  ...withDefined("title", body.title),
  ...withDefined("note", body.note),
  ...withDefined("tags", body.tags),
});

export const toDeleteBookmarkServiceInput = (params: {
  bookmarkId: string;
}): DeleteBookmarkInput => ({
  bookmarkId: params.bookmarkId,
});

export const toListBookmarksApiResponse = (result: ListBookmarksOutput): ListBookmarksOk => ({
  items: result.items.map(mapBookmarkSummary),
  nextCursor: result.nextCursor,
});

export const toCreateBookmarkApiResponse = (
  result: CreateBookmarkOutput,
): CreateBookmarkCreated => ({
  bookmark: mapBookmarkDetail(result.bookmark),
});

export const toGetBookmarkApiResponse = (result: GetBookmarkOutput): GetBookmarkOk => ({
  bookmark: mapBookmarkDetail(result.bookmark),
});

export const toUpdateBookmarkApiResponse = (result: UpdateBookmarkOutput): UpdateBookmarkOk => ({
  bookmark: mapBookmarkDetail(result.bookmark),
});
