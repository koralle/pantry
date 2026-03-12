import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";
import type { z } from "zod";
import type { Actor } from "../auth/actor";
import { type AppDb, createDb } from "../db/client";
import { bookmarks, bookmarkTags, tags } from "../db/schema";
import { badRequest } from "../errors/appError";
import type { SuggestTagsOk } from "../generated/schemas";
import type { TagsApiSuggestQueryParams } from "../generated/tags/tags.zod";

export type SuggestTagsInput = z.output<typeof TagsApiSuggestQueryParams>;
export type SuggestTagsOutput = SuggestTagsOk;

export interface TagsService {
  suggestTags(input: SuggestTagsInput): Promise<SuggestTagsOutput>;
}

interface CreateTagsServiceOptions {
  actor: Actor;
  db: D1Database;
}

const MAX_TAGS = 20;
const MAX_TAG_LENGTH = 32;

export const normalizeTags = (input: string[]): string[] => {
  if (input.length > MAX_TAGS) {
    throw badRequest("Invalid input", [
      `tags: Expected ${MAX_TAGS} tags or fewer`,
    ]);
  }

  const normalized = input.map((tag, index) => {
    const value = tag.trim().toLowerCase();
    if (value === "") {
      throw badRequest("Invalid input", [
        `tags.${index}: Tag must not be empty`,
      ]);
    }

    if (value.length > MAX_TAG_LENGTH) {
      throw badRequest("Invalid input", [
        `tags.${index}: Tag must be ${MAX_TAG_LENGTH} characters or fewer`,
      ]);
    }

    return value;
  });

  return [...new Set(normalized)].sort((left, right) =>
    left.localeCompare(right),
  );
};

export const upsertTags = async (
  db: AppDb,
  userId: string,
  names: string[],
): Promise<Array<{ id: string; name: string }>> => {
  if (names.length === 0) {
    return [];
  }

  const normalizedNames = normalizeTags(names);
  const existing = await db
    .select({
      id: tags.id,
      name: tags.name,
    })
    .from(tags)
    .where(and(eq(tags.userId, userId), inArray(tags.name, normalizedNames)));

  const existingByName = new Map(existing.map((tag) => [tag.name, tag.id]));
  const missing = normalizedNames.filter((name) => !existingByName.has(name));

  for (const name of missing) {
    const now = new Date().toISOString();
    await db
      .insert(tags)
      .values({
        id: uuidv7(),
        userId,
        name,
        createdAt: now,
      })
      .onConflictDoNothing();
  }

  return db
    .select({
      id: tags.id,
      name: tags.name,
    })
    .from(tags)
    .where(and(eq(tags.userId, userId), inArray(tags.name, normalizedNames)))
    .orderBy(asc(tags.name));
};

export const replaceBookmarkTags = async (
  db: AppDb,
  bookmarkId: string,
  tagIds: string[],
): Promise<void> => {
  await db.delete(bookmarkTags).where(eq(bookmarkTags.bookmarkId, bookmarkId));

  if (tagIds.length === 0) {
    return;
  }

  await db.insert(bookmarkTags).values(
    tagIds.map((tagId) => ({
      bookmarkId,
      tagId,
    })),
  );
};

export const listBookmarkTagNames = async (
  db: AppDb,
  bookmarkIds: string[],
): Promise<Map<string, string[]>> => {
  const tagsByBookmark = new Map<string, string[]>();

  if (bookmarkIds.length === 0) {
    return tagsByBookmark;
  }

  const rows = await db
    .select({
      bookmarkId: bookmarkTags.bookmarkId,
      name: tags.name,
    })
    .from(bookmarkTags)
    .innerJoin(tags, eq(bookmarkTags.tagId, tags.id))
    .where(inArray(bookmarkTags.bookmarkId, bookmarkIds))
    .orderBy(asc(tags.name));

  for (const row of rows) {
    const names = tagsByBookmark.get(row.bookmarkId) ?? [];
    names.push(row.name);
    tagsByBookmark.set(row.bookmarkId, names);
  }

  return tagsByBookmark;
};

export const listActiveBookmarkIdsForTags = async (
  db: AppDb,
  userId: string,
  names: string[],
  tagMode: "and" | "or",
): Promise<string[]> => {
  const normalizedNames = normalizeTags(names);

  if (normalizedNames.length === 0) {
    return [];
  }

  const baseQuery = db
    .select({
      bookmarkId: bookmarkTags.bookmarkId,
      matchedCount: sql<number>`count(distinct ${tags.name})`,
    })
    .from(bookmarkTags)
    .innerJoin(tags, eq(bookmarkTags.tagId, tags.id))
    .innerJoin(bookmarks, eq(bookmarkTags.bookmarkId, bookmarks.id))
    .where(
      and(
        eq(tags.userId, userId),
        inArray(tags.name, normalizedNames),
        isNull(bookmarks.deletedAt),
        eq(bookmarks.userId, userId),
      ),
    )
    .groupBy(bookmarkTags.bookmarkId);

  const rows =
    tagMode === "and"
      ? await baseQuery.having(
          sql`count(distinct ${tags.name}) = ${normalizedNames.length}`,
        )
      : await baseQuery;
  return rows.map((row) => row.bookmarkId);
};

export const createTagsService = ({
  actor,
  db,
}: CreateTagsServiceOptions): TagsService => {
  const database = createDb(db);

  return {
    async suggestTags(input) {
      const q = input.q.trim().toLowerCase();
      if (q === "") {
        throw badRequest("Invalid input", ["q: Query must not be empty"]);
      }

      const prefixRank = sql<number>`case when ${tags.name} like ${`${q}%`} then 0 else 1 end`;
      const bookmarkCount = sql<number>`count(${bookmarkTags.bookmarkId})`;

      const rows = await database
        .select({
          name: tags.name,
          count: bookmarkCount,
          prefixRank,
        })
        .from(tags)
        .innerJoin(bookmarkTags, eq(tags.id, bookmarkTags.tagId))
        .innerJoin(bookmarks, eq(bookmarkTags.bookmarkId, bookmarks.id))
        .where(
          and(
            eq(tags.userId, actor.userId),
            isNull(bookmarks.deletedAt),
            eq(bookmarks.userId, actor.userId),
            sql`${tags.name} like ${`%${q}%`}`,
          ),
        )
        .groupBy(tags.id, tags.name)
        .orderBy(prefixRank, desc(bookmarkCount), asc(tags.name))
        .limit(input.limit);

      return {
        items: rows.map((row) => ({
          name: row.name,
          count: row.count,
        })),
      };
    },
  };
};
