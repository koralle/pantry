import { contract } from "@pantry/api-contract";
import type { ApiContract } from "@pantry/api-contract";
import type { AppDb } from "@pantry/db";
import { bookmarkTable } from "@pantry/db/schema/bookmark";
import { bookmarkTagsTable } from "@pantry/db/schema/bookmark-tag";
import { tagsTable } from "@pantry/db/schema/tag";
import { eq } from "drizzle-orm";
import { uuidv7 } from "uuidv7";
import { describe, expect, it } from "vitest";

import {
  actor,
  createTestClient,
  other,
  withMigratedDb,
} from "../test/rpc-harness";
import type { ApiTestClient } from "../test/rpc-harness";

const seedTag = async (
  db: AppDb,
  input: {
    readonly userId: string;
    readonly name: string;
    readonly pinned?: boolean;
    readonly sortOrder?: number;
    readonly color?: string | null;
  }
): Promise<number> => {
  const [row] = await db
    .insert(tagsTable)
    .values({
      color: input.color ?? null,
      name: input.name,
      normalizedName: input.name.toLowerCase(),
      pinned: input.pinned ?? false,
      sortOrder: input.sortOrder ?? 0,
      userId: input.userId,
    })
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
    readonly tagIds: readonly number[];
    readonly deleted?: boolean;
  }
): Promise<string> => {
  const id = uuidv7();
  await db.insert(bookmarkTable).values({
    deletedAt: input.deleted === true ? new Date() : null,
    id,
    title: id,
    url: `https://example.com/${id}`,
    userId: input.userId,
  });
  if (input.tagIds.length > 0) {
    await db
      .insert(bookmarkTagsTable)
      .values(input.tagIds.map((tagId) => ({ bookmarkId: id, tagId })));
  }
  return id;
};

const tagRow = async (db: AppDb, id: number) => {
  const [row] = await db.select().from(tagsTable).where(eq(tagsTable.id, id));
  return row;
};

type TagProcedureName = keyof ApiContract["tags"];

/**
 * tags の全 procedure を、入力検証で落ちない正しい入力で呼ぶ。
 * `satisfies` で契約の key と過不足なく一致させ、procedure を足したら型エラーで気付く。
 */
const callEveryProcedure = (client: ApiTestClient) =>
  ({
    byId: async () => await client.tags.byId({ id: 1 }),
    create: async () => await client.tags.create({ name: "work" }),
    delete: async () => await client.tags.delete({ id: 1 }),
    list: async () => await client.tags.list({}),
    shelf: async () => await client.tags.shelf(),
    touch: async () => await client.tags.touch({ id: 1 }),
    update: async () =>
      await client.tags.update({
        color: null,
        id: 1,
        name: "work",
        pinned: false,
        sortOrder: 0,
      }),
  }) satisfies Record<TagProcedureName, () => Promise<unknown>>;

/** テスト対象は契約から取る。手で並べた一覧だと新しい procedure が 401 / CSRF の検査から漏れる。 */
const procedureNames = Object.keys(
  contract.tags
).toSorted() as TagProcedureName[];

describe("tags（本番 migration を適用した libSQL）", () => {
  const { getDb } = withMigratedDb();

  describe("認証と CSRF", () => {
    it("401 / CSRF の検査は契約の全 procedure を過不足なく呼ぶ", () => {
      expect(
        Object.keys(
          callEveryProcedure(createTestClient(getDb(), null))
        ).toSorted()
      ).toStrictEqual(procedureNames);
    });

    it.each(procedureNames)(
      "未認証の tags.%s は defined な UNAUTHORIZED（401）を返す",
      async (name) => {
        const call = callEveryProcedure(createTestClient(getDb(), null))[name];
        await expect(call()).rejects.toMatchObject({
          code: "UNAUTHORIZED",
          defined: true,
          status: 401,
        });
      }
    );

    it.each(procedureNames)(
      "x-csrf-token の無い tags.%s は認証済みでも 403 で拒否する（CSRF の除外は health / me だけ）",
      async (name) => {
        const call = callEveryProcedure(
          createTestClient(getDb(), actor, { csrf: false })
        )[name];
        await expect(call()).rejects.toMatchObject({
          code: "CSRF_TOKEN_MISMATCH",
          status: 403,
        });
      }
    );

    it("x-csrf-token の無い書き込みは 403 で拒否し、行を作らない", async () => {
      const client = createTestClient(getDb(), actor, { csrf: false });
      await expect(client.tags.create({ name: "work" })).rejects.toMatchObject({
        code: "CSRF_TOKEN_MISMATCH",
        status: 403,
      });
      await expect(getDb().select().from(tagsTable)).resolves.toStrictEqual([]);
    });

    it("DB の想定外の失敗は 500 にし、内部の message を返さない", async () => {
      const brokenDb = new Proxy({} as AppDb, {
        get: () => {
          throw new Error("secret db failure");
        },
      });
      const rejected: unknown = await createTestClient(brokenDb, actor)
        .tags.shelf()
        .catch((error: unknown) => error);

      expect(rejected).toMatchObject({
        code: "INTERNAL_SERVER_ERROR",
        status: 500,
      });
      expect(JSON.stringify(rejected)).not.toContain("secret");
    });
  });

  describe("create", () => {
    it("作成したタグの plain な id を返し、既定値で保存する", async () => {
      const created = await createTestClient(getDb(), actor).tags.create({
        name: "  Work  ",
      });

      expect(created).toStrictEqual({ id: expect.any(Number) });
      expect(await tagRow(getDb(), created.id)).toMatchObject({
        color: null,
        name: "Work",
        normalizedName: "work",
        pinned: false,
        sortOrder: 0,
        userId: actor.id,
      });
    });

    it("正規化して同じ名前は defined な 409 tag-name-already-exists", async () => {
      await seedTag(getDb(), { name: "Work", userId: actor.id });

      await expect(
        createTestClient(getDb(), actor).tags.create({ name: "WORK" })
      ).rejects.toMatchObject({
        code: "tag-name-already-exists",
        defined: true,
        status: 409,
      });
    });

    it("他ユーザーと同じ名前は衝突しない", async () => {
      await seedTag(getDb(), { name: "work", userId: other.id });

      await expect(
        createTestClient(getDb(), actor).tags.create({ name: "work" })
      ).resolves.toStrictEqual({ id: expect.any(Number) });
    });

    it("空の名前は 400 BAD_REQUEST で、行を作らない", async () => {
      await expect(
        createTestClient(getDb(), actor).tags.create({ name: "   " })
      ).rejects.toMatchObject({ code: "BAD_REQUEST", status: 400 });
      await expect(getDb().select().from(tagsTable)).resolves.toStrictEqual([]);
    });
  });

  describe("update", () => {
    it("全項目を置き換えて plain な id を返す", async () => {
      const id = await seedTag(getDb(), { name: "work", userId: actor.id });

      await expect(
        createTestClient(getDb(), actor).tags.update({
          color: "#ff0000",
          id,
          name: "Job",
          pinned: true,
          sortOrder: 3,
        })
      ).resolves.toStrictEqual({ id });
      expect(await tagRow(getDb(), id)).toMatchObject({
        color: "#ff0000",
        name: "Job",
        normalizedName: "job",
        pinned: true,
        sortOrder: 3,
      });
    });

    it("自分の別タグと同じ名前は 409 tag-name-already-exists", async () => {
      await seedTag(getDb(), { name: "home", userId: actor.id });
      const id = await seedTag(getDb(), { name: "work", userId: actor.id });

      await expect(
        createTestClient(getDb(), actor).tags.update({
          color: null,
          id,
          name: "HOME",
          pinned: false,
          sortOrder: 0,
        })
      ).rejects.toMatchObject({
        code: "tag-name-already-exists",
        defined: true,
        status: 409,
      });
    });

    it("他ユーザーのタグは 404 tag-not-found で、変更しない", async () => {
      const id = await seedTag(getDb(), { name: "secret", userId: other.id });

      await expect(
        createTestClient(getDb(), actor).tags.update({
          color: null,
          id,
          name: "stolen",
          pinned: true,
          sortOrder: 9,
        })
      ).rejects.toMatchObject({
        code: "tag-not-found",
        defined: true,
        status: 404,
      });
      expect(await tagRow(getDb(), id)).toMatchObject({
        name: "secret",
        pinned: false,
        userId: other.id,
      });
    });

    it("不正な色や欠けた項目は 400 BAD_REQUEST", async () => {
      const id = await seedTag(getDb(), { name: "work", userId: actor.id });
      const client = createTestClient(getDb(), actor);

      await expect(
        client.tags.update({
          color: "red",
          id,
          name: "work",
          pinned: false,
          sortOrder: 0,
        })
      ).rejects.toMatchObject({ code: "BAD_REQUEST", status: 400 });
      await expect(
        // full-replace 契約を外から崩す呼び出しを再現する
        client.tags.update({ id, name: "work" } as never)
      ).rejects.toMatchObject({ code: "BAD_REQUEST", status: 400 });
    });
  });

  describe("delete", () => {
    it("自分のタグを紐付けごと消し、bookmark は残す", async () => {
      const id = await seedTag(getDb(), { name: "work", userId: actor.id });
      const bookmarkId = await seedBookmark(getDb(), {
        tagIds: [id],
        userId: actor.id,
      });

      await expect(
        createTestClient(getDb(), actor).tags.delete({ id })
      ).resolves.toStrictEqual({ id });
      expect(await tagRow(getDb(), id)).toBeUndefined();
      await expect(
        getDb()
          .select()
          .from(bookmarkTagsTable)
          .where(eq(bookmarkTagsTable.bookmarkId, bookmarkId))
      ).resolves.toStrictEqual([]);
      await expect(
        getDb()
          .select({ id: bookmarkTable.id })
          .from(bookmarkTable)
          .where(eq(bookmarkTable.id, bookmarkId))
      ).resolves.toStrictEqual([{ id: bookmarkId }]);
    });

    it("他ユーザーのタグは 404 tag-not-found で、消さない", async () => {
      const id = await seedTag(getDb(), { name: "secret", userId: other.id });

      await expect(
        createTestClient(getDb(), actor).tags.delete({ id })
      ).rejects.toMatchObject({
        code: "tag-not-found",
        defined: true,
        status: 404,
      });
      expect(await tagRow(getDb(), id)).toMatchObject({ userId: other.id });
    });

    it("不正な id は 400 BAD_REQUEST", async () => {
      await expect(
        createTestClient(getDb(), actor).tags.delete({ id: 0 })
      ).rejects.toMatchObject({ code: "BAD_REQUEST", status: 400 });
    });
  });

  describe("touch", () => {
    it("自分のタグの lastUsedAt を更新して { ok: true } を返す", async () => {
      const id = await seedTag(getDb(), { name: "work", userId: actor.id });

      await expect(
        createTestClient(getDb(), actor).tags.touch({ id })
      ).resolves.toStrictEqual({ ok: true });
      expect((await tagRow(getDb(), id))?.lastUsedAt).toBeInstanceOf(Date);
    });

    it("他ユーザーのタグは 404 tag-not-found で、更新しない", async () => {
      const id = await seedTag(getDb(), { name: "secret", userId: other.id });

      await expect(
        createTestClient(getDb(), actor).tags.touch({ id })
      ).rejects.toMatchObject({
        code: "tag-not-found",
        defined: true,
        status: 404,
      });
      expect((await tagRow(getDb(), id))?.lastUsedAt).toBeNull();
    });
  });

  describe("byId", () => {
    it("自分のタグは画面用の projection だけを返す", async () => {
      const id = await seedTag(getDb(), {
        color: "#00ff00",
        name: "work",
        pinned: true,
        sortOrder: 2,
        userId: actor.id,
      });

      await expect(
        createTestClient(getDb(), actor).tags.byId({ id })
      ).resolves.toStrictEqual({
        color: "#00ff00",
        id,
        name: "work",
        pinned: true,
        sortOrder: 2,
      });
    });

    it("他ユーザーのタグは 404 tag-not-found", async () => {
      const id = await seedTag(getDb(), { name: "secret", userId: other.id });

      await expect(
        createTestClient(getDb(), actor).tags.byId({ id })
      ).rejects.toMatchObject({
        code: "tag-not-found",
        defined: true,
        status: 404,
      });
    });

    it("不正な id は 400 BAD_REQUEST", async () => {
      await expect(
        createTestClient(getDb(), actor).tags.byId({ id: 1.5 })
      ).rejects.toMatchObject({ code: "BAD_REQUEST", status: 400 });
    });
  });

  describe("list", () => {
    it("自分のタグだけを id 順に offset で分割して返す", async () => {
      const a = await seedTag(getDb(), { name: "a", userId: actor.id });
      await seedTag(getDb(), { name: "secret", userId: other.id });
      const b = await seedTag(getDb(), { name: "b", userId: actor.id });
      const c = await seedTag(getDb(), { name: "c", userId: actor.id });
      const client = createTestClient(getDb(), actor);

      await expect(client.tags.list({})).resolves.toStrictEqual([
        { id: a, name: "a" },
        { id: b, name: "b" },
        { id: c, name: "c" },
      ]);
      await expect(
        client.tags.list({ limit: 1, offset: 1 })
      ).resolves.toStrictEqual([{ id: b, name: "b" }]);
    });

    it("上限 50 を超える limit や負の offset は 400 BAD_REQUEST", async () => {
      const client = createTestClient(getDb(), actor);

      await expect(client.tags.list({ limit: 51 })).rejects.toMatchObject({
        code: "BAD_REQUEST",
        status: 400,
      });
      await expect(client.tags.list({ offset: -1 })).rejects.toMatchObject({
        code: "BAD_REQUEST",
        status: 400,
      });
    });
  });

  describe("shelf", () => {
    it("自分のタグだけを、削除済みと他人の bookmark を除いた件数つきで返す", async () => {
      const work = await seedTag(getDb(), {
        color: "#123456",
        name: "work",
        pinned: true,
        sortOrder: 1,
        userId: actor.id,
      });
      const empty = await seedTag(getDb(), { name: "empty", userId: actor.id });
      const secret = await seedTag(getDb(), {
        name: "secret",
        userId: other.id,
      });
      await seedBookmark(getDb(), { tagIds: [work], userId: actor.id });
      await seedBookmark(getDb(), {
        deleted: true,
        tagIds: [work],
        userId: actor.id,
      });
      await seedBookmark(getDb(), { tagIds: [secret], userId: other.id });
      const client = createTestClient(getDb(), actor);
      await client.tags.touch({ id: work });

      const shelf = await client.tags.shelf();

      expect(shelf.toSorted((x, y) => x.id - y.id)).toStrictEqual([
        {
          bookmarkCount: 1,
          color: "#123456",
          id: work,
          lastUsedAt: expect.any(Date),
          name: "work",
          pinned: true,
          sortOrder: 1,
        },
        {
          bookmarkCount: 0,
          color: null,
          id: empty,
          lastUsedAt: null,
          name: "empty",
          pinned: false,
          sortOrder: 0,
        },
      ]);
    });
  });
});
