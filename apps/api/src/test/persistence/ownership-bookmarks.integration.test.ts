import {
  bookmarkIdSchema,
  bookmarkNoteSchema,
  bookmarkTitleSchema,
  bookmarkUrlSchema,
} from "@pantry/api-contract/schemas/bookmark-values";
import { tagIdSchema } from "@pantry/api-contract/schemas/tag-values";
import { bookmarkTable } from "@pantry/db/schema/bookmark";
import { bookmarkTagsTable } from "@pantry/db/schema/bookmark-tag";
import { eq } from "drizzle-orm";
import * as v from "valibot";
import { describe, expect, test } from "vitest";

import { getBookmarkDetail } from "../../features/bookmarks/persistence/get-bookmark-detail";
import { insertBookmark } from "../../features/bookmarks/persistence/insert-bookmark";
import { listBookmarks } from "../../features/bookmarks/persistence/list-bookmarks";
import { selectBookmarkEditor } from "../../features/bookmarks/persistence/select-bookmark-editor";
import { softDeleteBookmark } from "../../features/bookmarks/persistence/soft-delete-bookmark";
import { updateBookmark } from "../../features/bookmarks/persistence/update-bookmark";
import {
  bookmarkId,
  seedBookmark,
  seedTag,
  seedUser,
  withPersistenceDb,
} from "./migrated-db";

const actor = "user-a";
const other = "user-b";
const ownBookmarkId = bookmarkId(1);
const otherBookmarkId = bookmarkId(2);

describe("bookmark ownership on migrated libSQL", () => {
  const persistence = withPersistenceDb();

  test("他ユーザーの bookmark は詳細・編集・更新・削除できない", async () => {
    const db = persistence.getDb();
    const actorId = await seedUser(db, actor);
    await seedUser(db, other);
    await seedBookmark(db, {
      id: otherBookmarkId,
      title: "他人",
      userId: other,
    });

    const detail = await getBookmarkDetail(db, actorId, {
      id: otherBookmarkId,
    });
    const editor = await selectBookmarkEditor(db, actorId, otherBookmarkId);
    const updated = await updateBookmark(db, {
      bookmarkId: v.parse(bookmarkIdSchema, otherBookmarkId),
      note: v.parse(bookmarkNoteSchema, null),
      tagIds: [],
      title: v.parse(bookmarkTitleSchema, "hijack"),
      url: v.parse(bookmarkUrlSchema, "https://example.com/hijack"),
      userId: actorId,
    });
    const deleted = await softDeleteBookmark(db, {
      id: otherBookmarkId,
      userId: actorId,
    });
    const [row] = await db
      .select({
        deletedAt: bookmarkTable.deletedAt,
        title: bookmarkTable.title,
      })
      .from(bookmarkTable)
      .where(eq(bookmarkTable.id, otherBookmarkId));

    expect(detail).toBeNull();
    expect(editor).toBeNull();
    expect(updated).toStrictEqual({ kind: "bookmark-not-found" });
    expect(deleted).toStrictEqual({ kind: "bookmark-not-found" });
    expect(row).toStrictEqual({ deletedAt: null, title: "他人" });
  });

  test("他ユーザーの tag は bookmark へ付けられない", async () => {
    const db = persistence.getDb();
    const actorId = await seedUser(db, actor);
    await seedUser(db, other);
    const foreignTagId = await seedTag(db, { name: "secret", userId: other });
    await seedBookmark(db, {
      id: ownBookmarkId,
      url: "https://example.com/own",
      userId: actor,
    });

    const attached = await insertBookmark(db, {
      note: v.parse(bookmarkNoteSchema, null),
      tagIds: [v.parse(tagIdSchema, foreignTagId)],
      title: v.parse(bookmarkTitleSchema, "new"),
      url: v.parse(bookmarkUrlSchema, "https://example.com/new"),
      userId: actorId,
    });
    const replaced = await updateBookmark(db, {
      bookmarkId: v.parse(bookmarkIdSchema, ownBookmarkId),
      note: v.parse(bookmarkNoteSchema, null),
      tagIds: [v.parse(tagIdSchema, foreignTagId)],
      title: v.parse(bookmarkTitleSchema, "own"),
      url: v.parse(bookmarkUrlSchema, "https://example.com/own"),
      userId: actorId,
    });
    const links = await db.select().from(bookmarkTagsTable);
    const bookmarks = await db
      .select({ url: bookmarkTable.url })
      .from(bookmarkTable);

    expect(attached).toStrictEqual({ kind: "invalid-tag" });
    expect(replaced).toStrictEqual({ kind: "invalid-tag" });
    expect(links).toStrictEqual([]);
    expect(bookmarks.map((row) => row.url)).toStrictEqual([
      "https://example.com/own",
    ]);
  });

  test("own bookmark に紐づいた他ユーザーの tag は一覧・詳細・編集 projection に出さない", async () => {
    const db = persistence.getDb();
    const actorId = await seedUser(db, actor);
    await seedUser(db, other);
    const ownTagId = await seedTag(db, { name: "work", userId: actor });
    const foreignTagId = await seedTag(db, { name: "secret", userId: other });
    await seedBookmark(db, {
      id: ownBookmarkId,
      tagIds: [ownTagId, foreignTagId],
      title: "自分",
      userId: actor,
    });

    const page = await listBookmarks(db, {
      userId: actorId,
    });
    const detail = await getBookmarkDetail(db, actorId, { id: ownBookmarkId });
    const editor = await selectBookmarkEditor(db, actorId, ownBookmarkId);

    expect(page.items.map((item) => item.id)).toStrictEqual([ownBookmarkId]);
    expect(page.items[0]?.tags).toStrictEqual([
      { color: null, id: ownTagId, name: "work" },
    ]);
    expect(detail?.tagNames).toStrictEqual(["work"]);
    expect(editor?.tagIds).toStrictEqual([ownTagId]);
  });
});
