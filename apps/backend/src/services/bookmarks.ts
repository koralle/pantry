import type { z } from "zod";
import {
  BookmarksApiCreateBody,
  BookmarksApiDeleteParams,
  BookmarksApiGetParams,
  BookmarksApiListQueryParams,
  BookmarksApiListResponse,
  BookmarksApiUpdateBody,
  BookmarksApiUpdateParams,
} from "../generated/bookmarks/bookmarks.zod";
import { TagsApiSuggestQueryParams } from "../generated/tags/tags.zod";
import type {
  CreateBookmarkCreated,
  GetBookmarkOk,
  SuggestTagsOk,
  UpdateBookmarkOk,
} from "../generated/schemas";

export type ListBookmarksInput = z.output<typeof BookmarksApiListQueryParams>;
export type ListBookmarksOutput = z.output<typeof BookmarksApiListResponse>;
export type CreateBookmarkInput = z.output<typeof BookmarksApiCreateBody>;
export type CreateBookmarkOutput = CreateBookmarkCreated;
export type GetBookmarkInput = z.output<typeof BookmarksApiGetParams>;
export type GetBookmarkOutput = GetBookmarkOk;
export type UpdateBookmarkInput = z.output<typeof BookmarksApiUpdateParams> &
  z.output<typeof BookmarksApiUpdateBody>;
export type UpdateBookmarkOutput = UpdateBookmarkOk;
export type DeleteBookmarkInput = z.output<typeof BookmarksApiDeleteParams>;
export type SuggestTagsInput = z.output<typeof TagsApiSuggestQueryParams>;
export type SuggestTagsOutput = SuggestTagsOk;

export interface BookmarksService {
  list(input: ListBookmarksInput): Promise<ListBookmarksOutput>;
  create(input: CreateBookmarkInput): Promise<CreateBookmarkOutput>;
  get(input: GetBookmarkInput): Promise<GetBookmarkOutput>;
  update(input: UpdateBookmarkInput): Promise<UpdateBookmarkOutput>;
  delete(input: DeleteBookmarkInput): Promise<void>;
  suggestTags(input: SuggestTagsInput): Promise<SuggestTagsOutput>;
}

const mockBookmark: GetBookmarkOutput["bookmark"] = {
  id: "018f47a8-3f13-7cc0-8f2a-9ad0b7f6eaf1",
  url: "https://example.com",
  title: "Example",
  tags: [],
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

export const createBookmarksService = (): BookmarksService => ({
  async list() {
    return {
      items: [],
      nextCursor: null,
    };
  },
  async create() {
    return {
      bookmark: mockBookmark,
    };
  },
  async get() {
    return {
      bookmark: mockBookmark,
    };
  },
  async update() {
    return {
      bookmark: mockBookmark,
    };
  },
  async delete() {},
  async suggestTags() {
    return {
      items: [],
    };
  },
});
