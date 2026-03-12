import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";
import type { Actor } from "../auth/actor";
import { type AppDb, createDb } from "../db/client";
import { bookmarks } from "../db/schema";
import { badRequest, notFound, urlConflict } from "../errors/appError";
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
import {
  listActiveBookmarkIdsForTags,
  listBookmarkTagNames,
  normalizeTags,
  replaceBookmarkTags,
  upsertTags,
} from "./tags";

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

interface CreateBookmarksServiceOptions {
  actor: Actor;
  db: D1Database;
}

const escapeLike = (value: string) =>
  value.replaceAll("\\", "\\\\").replaceAll("%", "\\%").replaceAll("_", "\\_");

const normalizeTitle = (
  title: string | undefined,
  fallback: string,
): string => {
  const normalizedTitle = title?.trim();
  return normalizedTitle === undefined || normalizedTitle === ""
    ? fallback
    : normalizedTitle;
};

const isUrlConflictError = (error: unknown): boolean =>
  error instanceof Error &&
  (error.message.includes("bookmarks_user_url_active_unique") ||
    error.message.includes(
      "UNIQUE constraint failed: bookmarks.user_id, bookmarks.url",
    ));

export const normalizeBookmarkUrl = (input: string): string => {
  const trimmed = input.trim();
  let parsed: URL;

  try {
    parsed = new URL(trimmed);
  } catch {
    throw badRequest("Invalid input", ["url: Invalid URL"]);
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw badRequest("Invalid input", [
      "url: Only http and https URLs are supported",
    ]);
  }

  parsed.protocol = parsed.protocol.toLowerCase();
  parsed.hostname = parsed.hostname.toLowerCase();
  parsed.hash = "";

  if (
    (parsed.protocol === "http:" && parsed.port === "80") ||
    (parsed.protocol === "https:" && parsed.port === "443")
  ) {
    parsed.port = "";
  }

  if (parsed.pathname !== "/" && parsed.pathname.endsWith("/")) {
    parsed.pathname = parsed.pathname.slice(0, -1);
  }

  return parsed.toString();
};

const mapBookmarkDto = (
  bookmark: typeof bookmarks.$inferSelect,
  tagNames: string[],
): BookmarkDetailDto => ({
  id: bookmark.id,
  url: bookmark.url,
  title: bookmark.title,
  ...(bookmark.note === null
    ? {}
    : bookmark.note === undefined
      ? {}
      : { note: bookmark.note }),
  tags: tagNames,
  createdAt: bookmark.createdAt,
  updatedAt: bookmark.updatedAt,
});

const listBookmarksByIds = async (
  db: AppDb,
  userId: string,
  bookmarkIds: string[],
  sort: "newest" | "updated",
  q: string | undefined,
  limit: number,
): Promise<(typeof bookmarks.$inferSelect)[]> => {
  const conditions = [
    eq(bookmarks.userId, userId),
    isNull(bookmarks.deletedAt),
  ];
  if (bookmarkIds.length > 0) {
    conditions.push(inArray(bookmarks.id, bookmarkIds));
  }

  if (q !== undefined) {
    const normalizedQuery = `%${escapeLike(q.toLowerCase())}%`;
    conditions.push(
      sql`(
        lower(${bookmarks.title}) like ${normalizedQuery} escape '\\'
        or lower(${bookmarks.url}) like ${normalizedQuery} escape '\\'
        or lower(coalesce(${bookmarks.note}, '')) like ${normalizedQuery} escape '\\'
      )`,
    );
  }

  return db
    .select()
    .from(bookmarks)
    .where(and(...conditions))
    .orderBy(
      sort === "updated"
        ? desc(bookmarks.updatedAt)
        : desc(bookmarks.createdAt),
      desc(bookmarks.id),
    )
    .limit(limit);
};

const findActiveBookmark = async (
  db: AppDb,
  userId: string,
  bookmarkId: string,
) => {
  const [bookmark] = await db
    .select()
    .from(bookmarks)
    .where(
      and(
        eq(bookmarks.id, bookmarkId),
        eq(bookmarks.userId, userId),
        isNull(bookmarks.deletedAt),
      ),
    )
    .limit(1);

  if (bookmark === undefined) {
    throw notFound();
  }

  return bookmark;
};

const ensureNoUrlConflict = async (
  db: AppDb,
  userId: string,
  normalizedUrl: string,
  excludeBookmarkId?: string,
) => {
  const existing = await db
    .select({ id: bookmarks.id })
    .from(bookmarks)
    .where(
      and(
        eq(bookmarks.userId, userId),
        eq(bookmarks.url, normalizedUrl),
        isNull(bookmarks.deletedAt),
        ...(excludeBookmarkId === undefined
          ? []
          : [sql`${bookmarks.id} <> ${excludeBookmarkId}`]),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    throw urlConflict();
  }
};

const getBookmarkDetail = async (
  db: AppDb,
  userId: string,
  bookmarkId: string,
): Promise<BookmarkDetailDto> => {
  const bookmark = await findActiveBookmark(db, userId, bookmarkId);
  const tagsByBookmark = await listBookmarkTagNames(db, [bookmark.id]);
  return mapBookmarkDto(bookmark, tagsByBookmark.get(bookmark.id) ?? []);
};

export const createBookmarksService = ({
  actor,
  db,
}: CreateBookmarksServiceOptions): BookmarksService => {
  const database = createDb(db);

  return {
    async list(input) {
      const normalizedTags =
        input.tags === undefined ? undefined : normalizeTags(input.tags);
      let bookmarkIds: string[] | undefined;

      if (normalizedTags !== undefined) {
        bookmarkIds = await listActiveBookmarkIdsForTags(
          database,
          actor.userId,
          normalizedTags,
          input.tagMode ?? "and",
        );

        if (bookmarkIds.length === 0) {
          return {
            items: [],
            nextCursor: null,
          };
        }
      }

      const rows = await listBookmarksByIds(
        database,
        actor.userId,
        bookmarkIds ?? [],
        input.sort ?? "newest",
        input.q?.trim() === "" ? undefined : input.q?.trim(),
        input.limit,
      );
      const tagsByBookmark = await listBookmarkTagNames(
        database,
        rows.map((bookmark) => bookmark.id),
      );

      return {
        items: rows.map((bookmark) =>
          mapBookmarkDto(bookmark, tagsByBookmark.get(bookmark.id) ?? []),
        ),
        nextCursor: null,
      };
    },
    async create(input) {
      const normalizedUrl = normalizeBookmarkUrl(input.url);
      const now = new Date().toISOString();
      const bookmarkId = uuidv7();
      const normalizedTagNames =
        input.tags === undefined ? [] : normalizeTags(input.tags);
      const title = normalizeTitle(input.title, normalizedUrl);

      await ensureNoUrlConflict(database, actor.userId, normalizedUrl);

      try {
        await database.insert(bookmarks).values({
          id: bookmarkId,
          userId: actor.userId,
          url: normalizedUrl,
          title,
          note: input.note,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        });
      } catch (error) {
        if (isUrlConflictError(error)) {
          throw urlConflict();
        }

        throw error;
      }

      const tagRows = await upsertTags(
        database,
        actor.userId,
        normalizedTagNames,
      );
      await replaceBookmarkTags(
        database,
        bookmarkId,
        tagRows.map((tag) => tag.id),
      );

      return {
        bookmark: await getBookmarkDetail(database, actor.userId, bookmarkId),
      };
    },
    async get(input) {
      return {
        bookmark: await getBookmarkDetail(
          database,
          actor.userId,
          input.bookmarkId,
        ),
      };
    },
    async update(input) {
      const existing = await findActiveBookmark(
        database,
        actor.userId,
        input.bookmarkId,
      );
      const existingTags = await listBookmarkTagNames(database, [existing.id]);
      const currentTags = existingTags.get(existing.id) ?? [];
      const nextUrl =
        input.url === undefined
          ? existing.url
          : normalizeBookmarkUrl(input.url);
      const nextTitle =
        input.title === undefined
          ? existing.title
          : normalizeTitle(input.title, nextUrl);
      const nextNote =
        input.note === undefined
          ? existing.note
          : input.note === null
            ? null
            : input.note;
      const normalizedNextTags =
        input.tags === undefined ? currentTags : normalizeTags(input.tags);

      if (nextUrl !== existing.url) {
        await ensureNoUrlConflict(database, actor.userId, nextUrl, existing.id);
      }

      const tagsChanged =
        normalizedNextTags.length !== currentTags.length ||
        normalizedNextTags.some((tag, index) => tag !== currentTags[index]);
      const bookmarkChanged =
        nextUrl !== existing.url ||
        nextTitle !== existing.title ||
        nextNote !== existing.note;

      if (bookmarkChanged || tagsChanged) {
        try {
          await database
            .update(bookmarks)
            .set({
              url: nextUrl,
              title: nextTitle,
              note: nextNote,
              updatedAt: new Date().toISOString(),
            })
            .where(eq(bookmarks.id, existing.id));
        } catch (error) {
          if (isUrlConflictError(error)) {
            throw urlConflict();
          }

          throw error;
        }
      }

      if (input.tags !== undefined) {
        const tagRows = await upsertTags(
          database,
          actor.userId,
          normalizedNextTags,
        );
        await replaceBookmarkTags(
          database,
          existing.id,
          tagRows.map((tag) => tag.id),
        );
      }

      return {
        bookmark: await getBookmarkDetail(database, actor.userId, existing.id),
      };
    },
    async delete(input) {
      const bookmark = await findActiveBookmark(
        database,
        actor.userId,
        input.bookmarkId,
      );
      await database
        .update(bookmarks)
        .set({
          deletedAt: new Date().toISOString(),
        })
        .where(eq(bookmarks.id, bookmark.id));
    },
  };
};
