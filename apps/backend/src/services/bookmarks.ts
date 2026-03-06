import type {
  BookmarkDetailDto,
  CreateBookmarkInputDto,
  CreateBookmarkOutputDto,
  DeleteBookmarkInputDto,
  GetBookmarkInputDto,
  GetBookmarkOutputDto,
  ListBookmarksInputDto,
  ListBookmarksOutputDto,
  UpdateBookmarkInputDto,
  UpdateBookmarkOutputDto,
} from "./bookmarks.dto";

export type ListBookmarksInput = ListBookmarksInputDto;
export type ListBookmarksOutput = ListBookmarksOutputDto;
export type CreateBookmarkInput = CreateBookmarkInputDto;
export type CreateBookmarkOutput = CreateBookmarkOutputDto;
export type GetBookmarkInput = GetBookmarkInputDto;
export type GetBookmarkOutput = GetBookmarkOutputDto;
export type UpdateBookmarkInput = UpdateBookmarkInputDto;
export type UpdateBookmarkOutput = UpdateBookmarkOutputDto;
export type DeleteBookmarkInput = DeleteBookmarkInputDto;

export interface BookmarksService {
  list(input: ListBookmarksInput): Promise<ListBookmarksOutput>;
  create(input: CreateBookmarkInput): Promise<CreateBookmarkOutput>;
  get(input: GetBookmarkInput): Promise<GetBookmarkOutput>;
  update(input: UpdateBookmarkInput): Promise<UpdateBookmarkOutput>;
  delete(input: DeleteBookmarkInput): Promise<void>;
}

const mockBookmark: BookmarkDetailDto = {
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
});
