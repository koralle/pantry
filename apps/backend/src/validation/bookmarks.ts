import { z } from "zod";
import { badRequest, invalidCursor } from "../errors/appError";
import {
  bookmarkIdSchema,
  coerceOptionalInt,
  trimToUndefined,
  validateWithSchema,
} from "../http/validation";

const TAG_MAX_LENGTH = 32;
const TAG_MAX_ITEMS = 20;
const LIMIT_DEFAULT = 20;
const LIMIT_MAX = 100;

const listBookmarksSchema = z.object({
  q: z.string().optional(),
  tags: z.array(z.string()).max(TAG_MAX_ITEMS).optional(),
  tagMode: z.enum(["and", "or"]).optional(),
  sort: z.enum(["newest", "updated"]).optional(),
  limit: z.number().int().min(1).max(LIMIT_MAX).default(LIMIT_DEFAULT),
  cursor: z.string().optional(),
});

const createBookmarkSchema = z.object({
  url: z.string().url().min(1).max(2048),
  title: z.string().min(1).max(512).optional(),
  note: z.string().max(4000).optional(),
  tags: z.array(z.string()).max(TAG_MAX_ITEMS).optional(),
});

const updateBookmarkSchema = z.object({
  url: z.string().url().min(1).max(2048).optional(),
  title: z.string().min(1).max(512).optional(),
  note: z.string().max(4000).nullable().optional(),
  tags: z.array(z.string()).max(TAG_MAX_ITEMS).optional(),
});

const validateTagFilters = (tags: string[] | undefined): string[] | undefined => {
  if (tags === undefined) {
    return undefined;
  }

  return tags.map((tag, index) => {
    const trimmed = tag.trim();

    if (trimmed === "") {
      throw badRequest("Invalid input", [`tags.${index}: Tag must not be empty`]);
    }

    if (trimmed.includes(",")) {
      throw badRequest("Invalid input", [`tags.${index}: CSV tag filters are not supported`]);
    }

    if (trimmed.length > TAG_MAX_LENGTH) {
      throw badRequest(
        "Invalid input",
        [`tags.${index}: Tag must be ${TAG_MAX_LENGTH} characters or fewer`],
      );
    }

    return trimmed;
  });
};

const validateTagBody = (tags: string[] | undefined): string[] | undefined => {
  if (tags === undefined) {
    return undefined;
  }

  return tags.map((tag, index) => {
    const trimmed = tag.trim();

    if (trimmed === "") {
      throw badRequest("Invalid input", [`tags.${index}: Tag must not be empty`]);
    }

    if (trimmed.length > TAG_MAX_LENGTH) {
      throw badRequest(
        "Invalid input",
        [`tags.${index}: Tag must be ${TAG_MAX_LENGTH} characters or fewer`],
      );
    }

    return trimmed;
  });
};

export const parseBookmarkId = (bookmarkId: string): string => {
  if (!bookmarkIdSchema.test(bookmarkId)) {
    throw badRequest("Invalid input", ["bookmarkId: Expected a UUID v7"]);
  }

  return bookmarkId;
};

export const parseListBookmarksQuery = (requestUrl: string) => {
  const url = new URL(requestUrl);
  const searchParams = url.searchParams;
  const limit = coerceOptionalInt(searchParams.get("limit") ?? undefined);
  const tags = searchParams.getAll("tags");
  const rawTags = tags.length > 0 ? tags : undefined;
  const q = trimToUndefined(searchParams.get("q") ?? undefined);
  const cursor = trimToUndefined(searchParams.get("cursor") ?? undefined);

  if (cursor !== undefined) {
    throw invalidCursor();
  }

  return validateWithSchema(listBookmarksSchema, {
    q,
    tags: validateTagFilters(rawTags),
    tagMode: searchParams.get("tagMode") ?? undefined,
    sort: searchParams.get("sort") ?? undefined,
    ...(limit === undefined ? {} : { limit }),
  });
};

export const parseCreateBookmarkBody = (input: unknown) => {
  const parsed = validateWithSchema(createBookmarkSchema, input);
  const title = parsed.title?.trim();

  if (parsed.title !== undefined && title === "") {
    throw badRequest("Invalid input", ["title: Title must not be empty"]);
  }

  return {
    ...parsed,
    ...(title === undefined ? {} : { title }),
    ...(parsed.note === undefined ? {} : { note: parsed.note }),
    ...(parsed.tags === undefined ? {} : { tags: validateTagBody(parsed.tags) }),
  };
};

export const parseUpdateBookmarkBody = (input: unknown) => {
  const parsed = validateWithSchema(updateBookmarkSchema, input);
  const title = parsed.title?.trim();

  if (parsed.title !== undefined && title === "") {
    throw badRequest("Invalid input", ["title: Title must not be empty"]);
  }

  return {
    ...parsed,
    ...(title === undefined ? {} : { title }),
    ...(parsed.tags === undefined ? {} : { tags: validateTagBody(parsed.tags) }),
  };
};
