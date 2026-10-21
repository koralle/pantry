import { executeCreateBookmark } from "../features/bookmarks/application/create-bookmark";
import { executeDeleteBookmark } from "../features/bookmarks/application/delete-bookmark";
import { executeSetBookmarkFavorite } from "../features/bookmarks/application/set-bookmark-favorite";
import { executeUpdateBookmark } from "../features/bookmarks/application/update-bookmark";
import { getBookmarkCount } from "../features/bookmarks/db/get-bookmark-count";
import type { BookmarkCountView } from "../features/bookmarks/db/get-bookmark-count";
import { getBookmarkDetail } from "../features/bookmarks/db/get-bookmark-detail";
import { insertBookmark } from "../features/bookmarks/db/insert-bookmark";
import { listBookmarks } from "../features/bookmarks/db/list-bookmarks";
import { selectBookmarkEditor } from "../features/bookmarks/db/select-bookmark-editor";
import { setBookmarkFavorite } from "../features/bookmarks/db/set-bookmark-favorite";
import { softDeleteBookmark } from "../features/bookmarks/db/soft-delete-bookmark";
import { updateBookmark } from "../features/bookmarks/db/update-bookmark";
import type { RouterKit } from "./base";

export const createBookmarksRouter = ({
  impl,
  requireAuthWithDb,
}: RouterKit) => {
  const bookmarks = impl.bookmarks;
  const countOf = (
    procedure: typeof bookmarks.counts.favorites,
    view: BookmarkCountView
  ) =>
    procedure
      .use(requireAuthWithDb)
      .handler(
        async ({ context }) =>
          await getBookmarkCount(context.db, context.userId, view)
      );

  return {
    counts: {
      favorites: countOf(bookmarks.counts.favorites, "favorites"),
      inbox: countOf(bookmarks.counts.inbox, "inbox"),
      recent: countOf(bookmarks.counts.recent, "recent"),
    },
    create: bookmarks.create
      .use(requireAuthWithDb)
      .handler(async ({ context, errors, input }) => {
        const db = context.db;
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
      .use(requireAuthWithDb)
      .handler(async ({ context, errors, input }) => {
        const db = context.db;
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
    detail: bookmarks.detail
      .use(requireAuthWithDb)
      .handler(async ({ context, errors, input }) => {
        const detail = await getBookmarkDetail(context.db, context.userId, {
          id: input.id,
        });
        if (detail === null) {
          throw errors["bookmark-not-found"]();
        }
        return detail;
      }),
    editor: bookmarks.editor
      .use(requireAuthWithDb)
      .handler(async ({ context, errors, input }) => {
        const record = await selectBookmarkEditor(
          context.db,
          context.userId,
          input.id
        );
        if (record === null) {
          throw errors["bookmark-not-found"]();
        }
        return record;
      }),
    list: bookmarks.list.use(requireAuthWithDb).handler(
      async ({ context, input }) =>
        await listBookmarks(context.db, {
          userId: context.userId,
          ...(input.tagNames === undefined ? {} : { tagNames: input.tagNames }),
          ...(input.cursor === undefined ? {} : { cursor: input.cursor }),
          ...(input.view === undefined ? {} : { view: input.view }),
        })
    ),
    setFavorite: bookmarks.setFavorite
      .use(requireAuthWithDb)
      .handler(async ({ context, errors, input }) => {
        const db = context.db;
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
      .use(requireAuthWithDb)
      .handler(async ({ context, errors, input }) => {
        const db = context.db;
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
