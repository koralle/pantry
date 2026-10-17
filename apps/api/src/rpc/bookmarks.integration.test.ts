import { isContractProcedure } from "@orpc/contract";
import type { AnyContractProcedure } from "@orpc/contract";
import { contract } from "@pantry/api-contract";
import type { ApiContract } from "@pantry/api-contract";
import type { AppDb } from "@pantry/db";
import { bookmarkTable } from "@pantry/db/schema/bookmark";
import { bookmarkTagsTable } from "@pantry/db/schema/bookmark-tag";
import { tagsTable } from "@pantry/db/schema/tag";
import { asc, eq } from "drizzle-orm";
import { uuidv7 } from "uuidv7";
import { describe, expect, it } from "vitest";

import { BOOKMARK_LIST_PAGE_SIZE } from "../features/bookmarks/lib/bookmark-list-page-size";
import {
  actor,
  createTestClient,
  other,
  withMigratedDb,
} from "../test/rpc-harness";
import type { ApiTestClient } from "../test/rpc-harness";

const seedTag = async (
  db: AppDb,
  userId: string,
  name: string
): Promise<number> => {
  const [row] = await db
    .insert(tagsTable)
    .values({ name, normalizedName: name.toLowerCase(), userId })
    .returning({ id: tagsTable.id });
  if (row === undefined) {
    throw new Error("seedTag failed");
  }
  return row.id;
};

const seedBookmark = async (
  db: AppDb,
  input: {
    readonly userId: string;
    readonly tagIds?: readonly number[];
    readonly deleted?: boolean;
    readonly favorite?: boolean;
    readonly createdAt?: Date;
    readonly url?: string;
    readonly title?: string;
    readonly note?: string | null;
  }
): Promise<string> => {
  const id = uuidv7();
  await db.insert(bookmarkTable).values({
    createdAt: input.createdAt ?? new Date(),
    deletedAt: input.deleted === true ? new Date() : null,
    favorite: input.favorite ?? false,
    id,
    note: input.note ?? null,
    title: input.title ?? `title ${id}`,
    updatedAt: input.createdAt ?? new Date(),
    url: input.url ?? `https://example.com/${id}`,
    userId: input.userId,
  });
  const tagIds = input.tagIds ?? [];
  if (tagIds.length > 0) {
    await db
      .insert(bookmarkTagsTable)
      .values(tagIds.map((tagId) => ({ bookmarkId: id, tagId })));
  }
  return id;
};

const bookmarkRow = async (db: AppDb, id: string) => {
  const [row] = await db
    .select()
    .from(bookmarkTable)
    .where(eq(bookmarkTable.id, id));
  return row;
};

const tagIdsOf = async (db: AppDb, bookmarkId: string): Promise<number[]> =>
  (
    await db
      .select({ tagId: bookmarkTagsTable.tagId })
      .from(bookmarkTagsTable)
      .where(eq(bookmarkTagsTable.bookmarkId, bookmarkId))
      .orderBy(asc(bookmarkTagsTable.tagId))
  ).map((row) => row.tagId);

const someId = "01a14ade-61b5-7416-af28-6ad04e6fc648";

/** 契約の router から procedure までの key を `.` でつないだもの（例: `counts.recent`）。 */
type ProcedurePath<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends AnyContractProcedure
    ? `${Prefix}${K}`
    : ProcedurePath<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

type BookmarkProcedureName = ProcedurePath<ApiContract["bookmarks"]>;

const procedurePaths = (router: object, prefix = ""): string[] =>
  Object.entries(router).flatMap(([key, value]: [string, unknown]) =>
    isContractProcedure(value)
      ? [`${prefix}${key}`]
      : procedurePaths(value as object, `${prefix}${key}.`)
  );

/** テスト対象は契約から取る。手で並べた一覧だと新しい procedure が 401 / CSRF の検査から漏れる。 */
const procedureNames = procedurePaths(
  contract.bookmarks
).toSorted() as BookmarkProcedureName[];

/**
 * bookmarks の全 procedure を、入力検証で落ちない正しい入力で呼ぶ。
 * `satisfies` で契約の procedure と過不足なく一致させ、procedure を足したら型エラーで気付く。
 */
const callEveryProcedure = (client: ApiTestClient) =>
  ({
    "counts.favorites": async () => await client.bookmarks.counts.favorites(),
    "counts.inbox": async () => await client.bookmarks.counts.inbox(),
    "counts.recent": async () => await client.bookmarks.counts.recent(),
    create: async () =>
      await client.bookmarks.create({
        note: null,
        tags: [],
        title: "t",
        url: "https://example.com/",
      }),
    delete: async () => await client.bookmarks.delete({ id: someId }),
    detail: async () => await client.bookmarks.detail({ id: someId }),
    editor: async () => await client.bookmarks.editor({ id: someId }),
    list: async () => await client.bookmarks.list({}),
    setFavorite: async () =>
      await client.bookmarks.setFavorite({ favorite: true, id: someId }),
    update: async () =>
      await client.bookmarks.update({
        id: someId,
        note: null,
        tags: [],
        title: "t",
        url: "https://example.com/",
      }),
  }) satisfies Record<BookmarkProcedureName, () => Promise<unknown>>;

const notFound = {
  code: "bookmark-not-found",
  defined: true,
  status: 404,
} as const;

describe("bookmarks（本番 migration を適用した libSQL）", () => {
  const { getDb } = withMigratedDb();
  const as = (user: typeof actor | null) => createTestClient(getDb(), user);

  describe("認証と CSRF", () => {
    it("401 / CSRF の検査は契約の全 procedure を過不足なく呼ぶ", () => {
      expect(
        Object.keys(callEveryProcedure(as(null))).toSorted()
      ).toStrictEqual(procedureNames);
    });

    it.each(procedureNames)(
      "x-csrf-token の無い bookmarks.%s は認証済みでも 403 で拒否する（CSRF の除外は health / me だけ）",
      async (name) => {
        await expect(
          callEveryProcedure(createTestClient(getDb(), actor, { csrf: false }))[
            name
          ]()
        ).rejects.toMatchObject({ code: "CSRF_TOKEN_MISMATCH", status: 403 });
      }
    );

    it.each(procedureNames)(
      "未認証の bookmarks.%s は defined な UNAUTHORIZED（401）を返す",
      async (name) => {
        await expect(
          callEveryProcedure(as(null))[name]()
        ).rejects.toMatchObject({
          code: "UNAUTHORIZED",
          defined: true,
          status: 401,
        });
      }
    );

    it("x-csrf-token の無い書き込みは 403 で拒否し、行を作らない", async () => {
      await expect(
        createTestClient(getDb(), actor, { csrf: false }).bookmarks.create({
          note: null,
          tags: [],
          title: "t",
          url: "https://example.com/",
        })
      ).rejects.toMatchObject({ code: "CSRF_TOKEN_MISMATCH", status: 403 });
      await expect(getDb().select().from(bookmarkTable)).resolves.toStrictEqual(
        []
      );
    });
  });

  describe("create", () => {
    it("自分のタグ付きで保存し、plain な id を返す", async () => {
      const tag = await seedTag(getDb(), actor.id, "work");

      const created = await as(actor).bookmarks.create({
        note: "memo",
        tags: [tag],
        title: "Example",
        url: "https://example.com/a",
      });

      expect(created).toStrictEqual({ id: expect.any(String) });
      expect(await bookmarkRow(getDb(), created.id)).toMatchObject({
        favorite: false,
        note: "memo",
        title: "Example",
        url: "https://example.com/a",
        userId: actor.id,
      });
      expect(await tagIdsOf(getDb(), created.id)).toStrictEqual([tag]);
    });

    it("他ユーザーのタグは 409 invalid-tag で、行を作らない", async () => {
      const foreign = await seedTag(getDb(), other.id, "secret");

      await expect(
        as(actor).bookmarks.create({
          note: null,
          tags: [foreign],
          title: "t",
          url: "https://example.com/a",
        })
      ).rejects.toMatchObject({
        code: "invalid-tag",
        defined: true,
        status: 409,
      });
      await expect(getDb().select().from(bookmarkTable)).resolves.toStrictEqual(
        []
      );
    });

    it("自分の同じ URL は 409 duplicate-url、他ユーザーの同じ URL は保存できる", async () => {
      await seedBookmark(getDb(), {
        url: "https://example.com/a",
        userId: actor.id,
      });
      await seedBookmark(getDb(), {
        url: "https://example.com/b",
        userId: other.id,
      });
      const input = { note: null, tags: [], title: "t" };

      await expect(
        as(actor).bookmarks.create({ ...input, url: "https://example.com/a" })
      ).rejects.toMatchObject({
        code: "duplicate-url",
        defined: true,
        status: 409,
      });
      await expect(
        as(actor).bookmarks.create({ ...input, url: "https://example.com/b" })
      ).resolves.toStrictEqual({ id: expect.any(String) });
    });

    it("http(s) 以外の URL や空のタイトルは 400 BAD_REQUEST", async () => {
      const client = as(actor);

      await expect(
        client.bookmarks.create({
          note: null,
          tags: [],
          title: "t",
          url: "ftp://example.com/file",
        })
      ).rejects.toMatchObject({ code: "BAD_REQUEST", status: 400 });
      await expect(
        client.bookmarks.create({
          note: null,
          tags: [],
          title: "   ",
          url: "https://example.com/",
        })
      ).rejects.toMatchObject({ code: "BAD_REQUEST", status: 400 });
    });
  });

  describe("update", () => {
    it("URL・タイトル・メモ・タグを丸ごと置き換える", async () => {
      const oldTag = await seedTag(getDb(), actor.id, "old");
      const newTag = await seedTag(getDb(), actor.id, "new");
      const id = await seedBookmark(getDb(), {
        tagIds: [oldTag],
        userId: actor.id,
      });

      await expect(
        as(actor).bookmarks.update({
          id,
          note: null,
          tags: [newTag],
          title: "Renamed",
          url: "https://example.com/renamed",
        })
      ).resolves.toStrictEqual({ id });
      expect(await bookmarkRow(getDb(), id)).toMatchObject({
        note: null,
        title: "Renamed",
        url: "https://example.com/renamed",
      });
      expect(await tagIdsOf(getDb(), id)).toStrictEqual([newTag]);
    });

    it("他ユーザーの bookmark は 404 で、変更しない", async () => {
      const id = await seedBookmark(getDb(), {
        title: "secret",
        userId: other.id,
      });

      await expect(
        as(actor).bookmarks.update({
          id,
          note: null,
          tags: [],
          title: "stolen",
          url: "https://example.com/stolen",
        })
      ).rejects.toMatchObject(notFound);
      expect(await bookmarkRow(getDb(), id)).toMatchObject({
        title: "secret",
        userId: other.id,
      });
    });

    it("他ユーザーのタグや重複したタグは 409 invalid-tag で、タグを変えない", async () => {
      const own = await seedTag(getDb(), actor.id, "own");
      const foreign = await seedTag(getDb(), other.id, "secret");
      const id = await seedBookmark(getDb(), {
        tagIds: [own],
        userId: actor.id,
      });
      const input = {
        id,
        note: null,
        title: "t",
        url: "https://example.com/t",
      };

      await expect(
        as(actor).bookmarks.update({ ...input, tags: [own, foreign] })
      ).rejects.toMatchObject({ code: "invalid-tag", status: 409 });
      await expect(
        as(actor).bookmarks.update({ ...input, tags: [own, own] })
      ).rejects.toMatchObject({ code: "invalid-tag", status: 409 });
      expect(await tagIdsOf(getDb(), id)).toStrictEqual([own]);
    });

    it("自分の別 bookmark と同じ URL は 409 duplicate-url", async () => {
      await seedBookmark(getDb(), {
        url: "https://example.com/taken",
        userId: actor.id,
      });
      const id = await seedBookmark(getDb(), { userId: actor.id });

      await expect(
        as(actor).bookmarks.update({
          id,
          note: null,
          tags: [],
          title: "t",
          url: "https://example.com/taken",
        })
      ).rejects.toMatchObject({ code: "duplicate-url", status: 409 });
    });
  });

  describe("editor / detail", () => {
    it("editor は編集用の projection を返し、他ユーザー・削除済みは 404", async () => {
      const tag = await seedTag(getDb(), actor.id, "work");
      const id = await seedBookmark(getDb(), {
        note: "memo",
        tagIds: [tag],
        title: "Example",
        url: "https://example.com/e",
        userId: actor.id,
      });
      const foreign = await seedBookmark(getDb(), { userId: other.id });
      const deleted = await seedBookmark(getDb(), {
        deleted: true,
        userId: actor.id,
      });

      await expect(as(actor).bookmarks.editor({ id })).resolves.toStrictEqual({
        id,
        note: "memo",
        tagIds: [tag],
        title: "Example",
        url: "https://example.com/e",
      });
      await expect(
        as(actor).bookmarks.editor({ id: foreign })
      ).rejects.toMatchObject(notFound);
      await expect(
        as(actor).bookmarks.editor({ id: deleted })
      ).rejects.toMatchObject(notFound);
    });

    it("detail はタグ名と ISO 文字列の日時を返し、他ユーザーは 404、UUID 以外は 400", async () => {
      const tag = await seedTag(getDb(), actor.id, "work");
      const createdAt = new Date("2026-01-02T03:04:05.000Z");
      const id = await seedBookmark(getDb(), {
        createdAt,
        favorite: true,
        tagIds: [tag],
        title: "Example",
        url: "https://example.com/d",
        userId: actor.id,
      });
      const foreign = await seedBookmark(getDb(), { userId: other.id });

      await expect(as(actor).bookmarks.detail({ id })).resolves.toStrictEqual({
        createdAt: createdAt.toISOString(),
        favorite: true,
        id,
        note: null,
        tagNames: ["work"],
        title: "Example",
        updatedAt: createdAt.toISOString(),
        url: "https://example.com/d",
      });
      await expect(
        as(actor).bookmarks.detail({ id: foreign })
      ).rejects.toMatchObject(notFound);
      await expect(
        as(actor).bookmarks.detail({ id: "not-a-uuid" })
      ).rejects.toMatchObject({ code: "BAD_REQUEST", status: 400 });
    });
  });

  describe("list", () => {
    it("自分の未削除の bookmark だけを新しい順に、自分のタグ付きで返す", async () => {
      const tag = await seedTag(getDb(), actor.id, "work");
      const older = await seedBookmark(getDb(), {
        createdAt: new Date("2026-01-01T00:00:00Z"),
        tagIds: [tag],
        userId: actor.id,
      });
      const newer = await seedBookmark(getDb(), {
        createdAt: new Date("2026-01-02T00:00:00Z"),
        userId: actor.id,
      });
      await seedBookmark(getDb(), { deleted: true, userId: actor.id });
      await seedBookmark(getDb(), { userId: other.id });

      const page = await as(actor).bookmarks.list({});

      expect(page.nextCursor).toBeNull();
      expect(page.items.map((item) => item.id)).toStrictEqual([newer, older]);
      expect(page.items[1]).toMatchObject({
        createdAt: "2026-01-01T00:00:00.000Z",
        tags: [{ color: null, id: tag, name: "work" }],
      });
    });

    it("nextCursor で続きを重複なく読める", async () => {
      const ids: string[] = [];
      for (let index = 0; index <= BOOKMARK_LIST_PAGE_SIZE; index += 1) {
        ids.push(
          await seedBookmark(getDb(), {
            createdAt: new Date(Date.UTC(2026, 0, 1, 0, index)),
            userId: actor.id,
          })
        );
      }
      const client = as(actor);

      const first = await client.bookmarks.list({});
      expect(first.items).toHaveLength(BOOKMARK_LIST_PAGE_SIZE);
      expect(first.nextCursor).toStrictEqual(expect.any(String));

      const second = await client.bookmarks.list({
        cursor: first.nextCursor ?? "",
      });
      expect(second.nextCursor).toBeNull();
      expect(
        [...first.items, ...second.items].map((item) => item.id)
      ).toStrictEqual(ids.toReversed());
    });

    it("view と tagNames で絞り込む（他ユーザーの同名タグは使わない）", async () => {
      const work = await seedTag(getDb(), actor.id, "work");
      const foreignWork = await seedTag(getDb(), other.id, "work");
      const tagged = await seedBookmark(getDb(), {
        tagIds: [work],
        userId: actor.id,
      });
      const favorite = await seedBookmark(getDb(), {
        favorite: true,
        userId: actor.id,
      });
      await seedBookmark(getDb(), { tagIds: [foreignWork], userId: other.id });
      const client = as(actor);
      const idsOf = async (
        input: Parameters<typeof client.bookmarks.list>[0]
      ) => (await client.bookmarks.list(input)).items.map((item) => item.id);

      await expect(idsOf({ view: "favorites" })).resolves.toStrictEqual([
        favorite,
      ]);
      await expect(idsOf({ view: "inbox" })).resolves.toStrictEqual([favorite]);
      await expect(idsOf({ tagNames: ["WORK"] })).resolves.toStrictEqual([
        tagged,
      ]);
    });

    it("壊れた cursor は 400 BAD_REQUEST", async () => {
      await expect(
        as(actor).bookmarks.list({ cursor: "broken" })
      ).rejects.toMatchObject({ code: "BAD_REQUEST", status: 400 });
    });
  });

  describe("counts", () => {
    it("自分の未削除の件数を view ごとに返す", async () => {
      const tag = await seedTag(getDb(), actor.id, "work");
      await seedBookmark(getDb(), { tagIds: [tag], userId: actor.id });
      await seedBookmark(getDb(), { favorite: true, userId: actor.id });
      await seedBookmark(getDb(), { deleted: true, userId: actor.id });
      await seedBookmark(getDb(), { favorite: true, userId: other.id });
      const client = as(actor);

      await expect(client.bookmarks.counts.recent()).resolves.toBe(2);
      await expect(client.bookmarks.counts.inbox()).resolves.toBe(1);
      await expect(client.bookmarks.counts.favorites()).resolves.toBe(1);
    });
  });

  describe("delete / setFavorite", () => {
    it("delete は自分の bookmark を soft delete し、二度目は 404", async () => {
      const id = await seedBookmark(getDb(), { userId: actor.id });
      const client = as(actor);

      await expect(client.bookmarks.delete({ id })).resolves.toStrictEqual({
        id,
      });
      expect((await bookmarkRow(getDb(), id))?.deletedAt).toBeInstanceOf(Date);
      await expect(client.bookmarks.delete({ id })).rejects.toMatchObject(
        notFound
      );
    });

    it("他ユーザーの bookmark は delete / setFavorite とも 404 で、変更しない", async () => {
      const id = await seedBookmark(getDb(), { userId: other.id });
      const client = as(actor);

      await expect(client.bookmarks.delete({ id })).rejects.toMatchObject(
        notFound
      );
      await expect(
        client.bookmarks.setFavorite({ favorite: true, id })
      ).rejects.toMatchObject(notFound);
      expect(await bookmarkRow(getDb(), id)).toMatchObject({
        deletedAt: null,
        favorite: false,
      });
    });

    it("setFavorite は指定した値へ切り替える", async () => {
      const id = await seedBookmark(getDb(), { userId: actor.id });
      const client = as(actor);

      await expect(
        client.bookmarks.setFavorite({ favorite: true, id })
      ).resolves.toStrictEqual({ id });
      expect((await bookmarkRow(getDb(), id))?.favorite).toBe(true);
      await client.bookmarks.setFavorite({ favorite: false, id });
      expect((await bookmarkRow(getDb(), id))?.favorite).toBe(false);
    });
  });
});
