import { describe, expect, test } from "vitest";

import { getBookmarkDetail } from "../../features/bookmarks/db/get-bookmark-detail";
import { listBookmarks } from "../../features/bookmarks/db/list-bookmarks";
import { selectBookmarkEditor } from "../../features/bookmarks/db/select-bookmark-editor";
import {
  bookmarkId,
  seedBookmark,
  seedTag,
  seedUser,
  withTestDb,
} from "./migrated-db";

const actor = "user-a";
const other = "user-b";
const ownBookmarkId = bookmarkId(1);

describe("bookmark tag projection on migrated libSQL", () => {
  const testDb = withTestDb();

  test("own bookmark に紐づいた他ユーザーの tag は一覧・詳細・編集 projection に出さない", async () => {
    const db = testDb.getDb();
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

    const page = await listBookmarks(db, { userId: actorId });
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
