import { bookmarkIdSchema } from "@pantry/api-contract/schemas/bookmark-values";
import * as v from "valibot";

import type { UserId } from "../../features/auth/domain/auth-values";
import {
  createBookmarkInputSchema,
  executeCreateBookmark,
} from "../../features/bookmarks/application/create-bookmark";
import type { InsertBookmark } from "../../features/bookmarks/application/create-bookmark";
import { executeDeleteBookmark } from "../../features/bookmarks/application/delete-bookmark";
import type { SoftDeleteBookmark } from "../../features/bookmarks/application/delete-bookmark";
import { executeSetBookmarkFavorite } from "../../features/bookmarks/application/set-bookmark-favorite";
import type { SetBookmarkFavorite } from "../../features/bookmarks/application/set-bookmark-favorite";
import {
  executeUpdateBookmark,
  updateBookmarkInputSchema,
} from "../../features/bookmarks/application/update-bookmark";
import type { UpdateBookmark } from "../../features/bookmarks/application/update-bookmark";
import { decodeBookmarkListCursor } from "../../features/bookmarks/lib/list/bookmark-list-cursor";
import type { BookmarkCountView } from "../../features/bookmarks/persistence/get-bookmark-count";
import type { BookmarkDetail } from "../../features/bookmarks/persistence/get-bookmark-detail";
import type {
  BookmarkListPage,
  BookmarkListQuery,
} from "../../features/bookmarks/persistence/list-bookmarks";
import type { ProcedureKit } from "./procedure-kit";

export interface BookmarkEditorOutput {
  readonly id: string;
  readonly url: string;
  readonly title: string;
  readonly note: string | null;
  readonly tagIds: number[];
}

type FindBookmarkEditor = (
  userId: UserId,
  id: string
) => Promise<BookmarkEditorOutput | null>;

export interface BookmarksDeps {
  readonly insertBookmark: InsertBookmark;
  readonly updateBookmark: UpdateBookmark;
  readonly findBookmarkEditor: FindBookmarkEditor;
  readonly listBookmarks: (
    input: { readonly userId: UserId } & BookmarkListQuery
  ) => Promise<BookmarkListPage>;
  readonly getBookmarkCount: (
    userId: UserId,
    view: BookmarkCountView
  ) => Promise<number>;
  readonly getBookmarkDetail: (
    userId: UserId,
    input: { readonly id: string }
  ) => Promise<BookmarkDetail | null>;
  readonly setBookmarkFavorite: SetBookmarkFavorite;
  readonly softDeleteBookmark: SoftDeleteBookmark;
}

/** client へ branded `BookmarkId` を出すと、画面が Domain の組み立てを知っていることになるため plain な型にする。 */
export interface CreateBookmarkOutput {
  readonly id: string;
}

export interface UpdateBookmarkOutput {
  readonly id: string;
}

/** `title` は外部 fetch なので、ここ（api へ移す側）に含めない。 */
export const createBookmarkProcedures = (
  { base, requireAuth }: ProcedureKit,
  deps: BookmarksDeps
) => {
  const createBookmark = base
    .use(requireAuth)
    .input(createBookmarkInputSchema)
    .errors({
      "duplicate-url": {
        status: 409,
      },
      "invalid-tag": {
        status: 409,
      },
    })
    .handler(async ({ input, context, errors }) => {
      const result = await executeCreateBookmark({
        command: input,
        insertBookmark: deps.insertBookmark,
        userId: context.userId,
      });

      if (!result.ok) {
        if (result.error.code === "duplicate-url") {
          throw errors["duplicate-url"]();
        }
        throw errors["invalid-tag"]();
      }

      const output: CreateBookmarkOutput = {
        id: result.value.id,
      };

      return output;
    });
  const updateBookmark = base
    .use(requireAuth)
    .input(updateBookmarkInputSchema)
    .errors({
      "bookmark-not-found": {
        status: 404,
      },
      "duplicate-url": {
        status: 409,
      },
      "invalid-tag": {
        status: 409,
      },
    })
    .handler(async ({ input, context, errors }) => {
      const result = await executeUpdateBookmark({
        command: input,
        updateBookmark: deps.updateBookmark,
        userId: context.userId,
      });

      if (!result.ok) {
        throw errors[result.error.code]();
      }

      const output: UpdateBookmarkOutput = {
        id: result.value.id,
      };

      return output;
    });
  const editor = base
    .use(requireAuth)
    .input(
      v.object({
        id: bookmarkIdSchema,
      })
    )
    .errors({
      "bookmark-not-found": {
        status: 404,
      },
    })
    .handler(
      async ({ input, context, errors }): Promise<BookmarkEditorOutput> => {
        const record = await deps.findBookmarkEditor(context.userId, input.id);

        if (record === null || record === undefined) {
          throw errors["bookmark-not-found"]();
        }

        return record;
      }
    );

  const bookmarkListInputSchema = v.object({
    cursor: v.optional(
      v.pipe(
        v.string(),
        v.minLength(1),
        v.maxLength(200),
        v.check((value) => decodeBookmarkListCursor(value) != null)
      )
    ),
    tagNames: v.optional(v.pipe(v.array(v.string()), v.maxLength(20))),
    view: v.optional(v.picklist(["recent", "inbox", "favorites"])),
  });
  const bookmarkIdInputSchema = v.object({ id: v.pipe(v.string(), v.uuid()) });

  const listBookmarks = base
    .use(requireAuth)
    .input(bookmarkListInputSchema)
    .handler(
      async ({ input, context }) =>
        await deps.listBookmarks({
          userId: context.userId,
          ...(input.tagNames === undefined ? {} : { tagNames: input.tagNames }),
          ...(input.cursor === undefined ? {} : { cursor: input.cursor }),
          ...(input.view === undefined ? {} : { view: input.view }),
        })
    );

  const bookmarkCount = (view: BookmarkCountView) =>
    base
      .use(requireAuth)
      .handler(
        async ({ context }) => await deps.getBookmarkCount(context.userId, view)
      );

  const bookmarkDetail = base
    .use(requireAuth)
    .errors({
      "bookmark-not-found": {
        status: 404,
      },
    })
    .input(bookmarkIdInputSchema)
    .handler(async ({ input, context, errors }) => {
      const detail = await deps.getBookmarkDetail(context.userId, {
        id: input.id,
      });

      if (detail === null || detail === undefined) {
        throw errors["bookmark-not-found"]();
      }

      return detail;
    });

  const deleteBookmark = base
    .use(requireAuth)
    .errors({
      "bookmark-not-found": {
        status: 404,
      },
    })
    .input(bookmarkIdInputSchema)
    .handler(async ({ input, context, errors }) => {
      const result = await executeDeleteBookmark({
        command: input,
        softDeleteBookmark: deps.softDeleteBookmark,
        userId: context.userId,
      });

      if (result.kind === "bookmark-not-found") {
        throw errors["bookmark-not-found"]();
      }

      return { id: result.id };
    });

  const setFavorite = base
    .use(requireAuth)
    .errors({
      "bookmark-not-found": {
        status: 404,
      },
    })
    .input(
      v.object({
        favorite: v.boolean(),
        id: v.pipe(v.string(), v.uuid()),
      })
    )
    .handler(async ({ input, context, errors }) => {
      const result = await executeSetBookmarkFavorite({
        command: input,
        setBookmarkFavorite: deps.setBookmarkFavorite,
        userId: context.userId,
      });

      if (result.kind === "bookmark-not-found") {
        throw errors["bookmark-not-found"]();
      }

      return { id: result.id };
    });

  return {
    counts: {
      favorites: bookmarkCount("favorites"),
      inbox: bookmarkCount("inbox"),
      recent: bookmarkCount("recent"),
    },
    create: createBookmark,
    delete: deleteBookmark,
    detail: bookmarkDetail,
    editor,
    list: listBookmarks,
    setFavorite,
    update: updateBookmark,
  };
};
