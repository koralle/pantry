import type {
  BookmarkDetail,
  BookmarkSummary,
  BookmarksApiListParams,
  CreateBookmarkCreated,
  CreateBookmarkRequest,
  GetBookmarkOk,
  ListBookmarksOk,
  UpdateBookmarkOk,
  UpdateBookmarkRequest,
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
  query: BookmarksApiListParams,
  defaultLimit: number,
): ListBookmarksInput => ({
  limit: query.limit ?? defaultLimit,
  ...withDefined("q", query.q),
  ...withDefined("tags", query.tags),
  ...withDefined("tagMode", query.tagMode),
  ...withDefined("sort", query.sort),
  ...withDefined("cursor", query.cursor),
});

export const toCreateBookmarkServiceInput = (body: CreateBookmarkRequest): CreateBookmarkInput => ({
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
  body: UpdateBookmarkRequest,
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
