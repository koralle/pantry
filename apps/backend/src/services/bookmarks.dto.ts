export type BookmarkSort = "newest" | "updated";
export type TagMode = "and" | "or";

export interface BookmarkDetailDto {
  id: string;
  url: string;
  title: string;
  note?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BookmarkSummaryDto {
  id: string;
  url: string;
  title: string;
  note?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ListBookmarksInputDto {
  q?: string;
  tags?: string[];
  tagMode?: TagMode;
  sort?: BookmarkSort;
  limit: number;
  cursor?: string;
}

export interface ListBookmarksOutputDto {
  items: BookmarkSummaryDto[];
  nextCursor: string | null;
}

export interface CreateBookmarkInputDto {
  url: string;
  title?: string;
  note?: string;
  tags?: string[];
}

export interface CreateBookmarkOutputDto {
  bookmark: BookmarkDetailDto;
}

export interface GetBookmarkInputDto {
  bookmarkId: string;
}

export interface GetBookmarkOutputDto {
  bookmark: BookmarkDetailDto;
}

export interface UpdateBookmarkInputDto {
  bookmarkId: string;
  url?: string;
  title?: string;
  note?: string | null;
  tags?: string[];
}

export interface UpdateBookmarkOutputDto {
  bookmark: BookmarkDetailDto;
}

export interface DeleteBookmarkInputDto {
  bookmarkId: string;
}
