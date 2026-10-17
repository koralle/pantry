import { executeCreateBookmark } from "../features/bookmarks/application/create-bookmark";
import { executeDeleteBookmark } from "../features/bookmarks/application/delete-bookmark";
import { executeSetBookmarkFavorite } from "../features/bookmarks/application/set-bookmark-favorite";
import { executeUpdateBookmark } from "../features/bookmarks/application/update-bookmark";
import { getBookmarkCount } from "../features/bookmarks/persistence/get-bookmark-count";
import type { BookmarkCountView } from "../features/bookmarks/persistence/get-bookmark-count";
import { getBookmarkDetail } from "../features/bookmarks/persistence/get-bookmark-detail";
import { insertBookmark } from "../features/bookmarks/persistence/insert-bookmark";
import { listBookmarks } from "../features/bookmarks/persistence/list-bookmarks";
import { selectBookmarkEditor } from "../features/bookmarks/persistence/select-bookmark-editor";
import { setBookmarkFavorite } from "../features/bookmarks/persistence/set-bookmark-favorite";
import { softDeleteBookmark } from "../features/bookmarks/persistence/soft-delete-bookmark";
import { updateBookmark } from "../features/bookmarks/persistence/update-bookmark";
import type { RouterKit } from "./base";

/**
 * `bookmarks.*` の実装（`title` は web に残る）。どの procedure も requireAuth の `userId` で
 * 所有者を絞り込み、他ユーザーや削除済みの bookmark は `bookmark-not-found` として扱う。
 * 想定外の失敗は包み直さず 500 に抜ける。
 */
export const createBookmarksRouter = ({
  deps,
  impl,
  requireAuth,
}: RouterKit) => {
  const bookmarks = impl.bookmarks;
  const countOf = (
    procedure: typeof bookmarks.counts.favorites,
    view: BookmarkCountView
  ) =>
    procedure
      .use(requireAuth)
      .handler(
        async ({ context }) =>
          await getBookmarkCount(deps.db(), context.userId, view)
      );

  return {
    counts: {
      favorites: countOf(bookmarks.counts.favorites, "favorites"),
      inbox: countOf(bookmarks.counts.inbox, "inbox"),
      recent: countOf(bookmarks.counts.recent, "recent"),
    },
    create: bookmarks.create
      .use(requireAuth)
      .handler(async ({ context, errors, input }) => {
        const db = deps.db();
        const result = await executeCreateBookmark({
          command: input,
          insertBookmark: async (row) => await insertBookmark(db, row),
          userId: context.userId,
        });
        if (result.ok) {
          return { id: result.value.id };
        }
        if (result.error.code === "duplicate-url") {
          throw errors["duplicate-url"]();
        }
        throw errors["invalid-tag"]();
      }),
    delete: bookmarks.delete
      .use(requireAuth)
      .handler(async ({ context, errors, input }) => {
        const db = deps.db();
        const result = await executeDeleteBookmark({
          command: input,
          softDeleteBookmark: async (target) =>
            await softDeleteBookmark(db, target),
          userId: context.userId,
        });
        if (result.kind === "bookmark-not-found") {
          throw errors["bookmark-not-found"]();
        }
        return { id: result.id };
      }),
    /** Query service の対象なし null は、ここでだけ 404 defined error へ変換する。 */
    detail: bookmarks.detail
      .use(requireAuth)
      .handler(async ({ context, errors, input }) => {
        const detail = await getBookmarkDetail(deps.db(), context.userId, {
          id: input.id,
        });
        if (detail === null) {
          throw errors["bookmark-not-found"]();
        }
        return detail;
      }),
    editor: bookmarks.editor
      .use(requireAuth)
      .handler(async ({ context, errors, input }) => {
        const record = await selectBookmarkEditor(
          deps.db(),
          context.userId,
          input.id
        );
        if (record === null) {
          throw errors["bookmark-not-found"]();
        }
        return record;
      }),
    list: bookmarks.list.use(requireAuth).handler(
      async ({ context, input }) =>
        await listBookmarks(deps.db(), {
          userId: context.userId,
          ...(input.tagNames === undefined ? {} : { tagNames: input.tagNames }),
          ...(input.cursor === undefined ? {} : { cursor: input.cursor }),
          ...(input.view === undefined ? {} : { view: input.view }),
        })
    ),
    setFavorite: bookmarks.setFavorite
      .use(requireAuth)
      .handler(async ({ context, errors, input }) => {
        const db = deps.db();
        const result = await executeSetBookmarkFavorite({
          command: input,
          setBookmarkFavorite: async (target) =>
            await setBookmarkFavorite(db, target),
          userId: context.userId,
        });
        if (result.kind === "bookmark-not-found") {
          throw errors["bookmark-not-found"]();
        }
        return { id: result.id };
      }),
    update: bookmarks.update
      .use(requireAuth)
      .handler(async ({ context, errors, input }) => {
        const db = deps.db();
        const result = await executeUpdateBookmark({
          command: input,
          updateBookmark: async (row) => await updateBookmark(db, row),
          userId: context.userId,
        });
        if (!result.ok) {
          throw errors[result.error.code]();
        }
        return { id: result.value.id };
      }),
  };
};
