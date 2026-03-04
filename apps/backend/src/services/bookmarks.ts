import type { z } from "zod";
import {
  BookmarksApiListQueryParams,
  BookmarksApiListResponse,
} from "../generated/bookmarks/bookmarks.zod";

export type ListBookmarksInput = z.output<typeof BookmarksApiListQueryParams>;
export type ListBookmarksOutput = z.output<typeof BookmarksApiListResponse>;

export interface BookmarksService {
  list(input: ListBookmarksInput): Promise<ListBookmarksOutput>;
}

export const createBookmarksService = (): BookmarksService => ({
  async list() {
    return {
      items: [],
      nextCursor: null,
    };
  },
});
