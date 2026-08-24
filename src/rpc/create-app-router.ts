import { ORPCError, os } from '@orpc/server'
import * as v from 'valibot'

import { userIdSchema } from '../features/auth/domain/auth-values'
import type { SessionUser, UserId } from '../features/auth/domain/auth-values'
import {
  createBookmarkInputSchema,
  executeCreateBookmark
} from '../features/bookmarks/application/create-bookmark'
import type { InsertBookmark } from '../features/bookmarks/application/create-bookmark'
import { executeDeleteBookmark } from '../features/bookmarks/application/delete-bookmark'
import type { SoftDeleteBookmark } from '../features/bookmarks/application/delete-bookmark'
import {
  executeFetchPageTitle,
  fetchPageTitleInputSchema
} from '../features/bookmarks/application/fetch-page-title'
import type { FetchPageTitle } from '../features/bookmarks/application/fetch-page-title'
import {
  executeUpdateBookmark,
  updateBookmarkInputSchema
} from '../features/bookmarks/application/update-bookmark'
import type { UpdateBookmark } from '../features/bookmarks/application/update-bookmark'
import { bookmarkIdSchema } from '../features/bookmarks/domain/bookmark-values'
import type { BookmarkDetail } from '../features/bookmarks/persistence/get-bookmark-detail'
import type {
  BookmarkListItem,
  BookmarkListQuery
} from '../features/bookmarks/persistence/list-bookmarks'
import {
  createTagInputSchema,
  executeCreateTag,
  toCreateTagCommand
} from '../features/tags/application/create-tag'
import type { InsertTag } from '../features/tags/application/create-tag'
import { executeTouchTag, touchTagInputSchema } from '../features/tags/application/touch-tag'
import type { TouchTag } from '../features/tags/application/touch-tag'
import {
  executeUpdateTag,
  toUpdateTagCommand,
  updateTagInputSchema
} from '../features/tags/application/update-tag'
import type { UpdateTag } from '../features/tags/application/update-tag'
import type { ShelfTag, TagRecord } from '../features/tags/lib/tag-shelf'
import type { TagsListRow } from '../features/tags/persistence/select-tags'
import { offsetPaginationQuerySchema } from '../schemas/pagination'

type GetSession = (headers: Headers) => Promise<SessionUser | null>

const tagIdInputSchema = v.object({
  id: v.pipe(v.number(), v.integer(), v.minValue(1))
})

/** 編集画面に必要な projection。branded な型は wire output に残さない。 */
export type BookmarkEditorOutput = {
  readonly id: string
  readonly url: string
  readonly title: string
  readonly note: string | null
  readonly tagIds: number[]
}

type FindBookmarkEditor = (userId: UserId, id: string) => Promise<BookmarkEditorOutput | null>

/**
 * 本番の Better Auth / Drizzle をここに閉じ込めるための差し込み口。
 * RPC テストは session と各 service を差し替え、Turso を立てずに契約だけを叩く。
 */
export type AppRouterDeps = {
  readonly getSession: GetSession
  readonly insertTag: InsertTag
  readonly updateTag: UpdateTag
  readonly touchTag: TouchTag
  readonly listShelfTags: (userId: UserId) => Promise<ShelfTag[]>
  readonly listTags: (
    userId: UserId,
    page: v.InferOutput<typeof offsetPaginationQuerySchema>
  ) => Promise<TagsListRow[]>
  readonly findTagById: (userId: UserId, id: number) => Promise<TagRecord | null>
  readonly insertBookmark: InsertBookmark
  readonly fetchPageTitle: FetchPageTitle
  readonly updateBookmark: UpdateBookmark
  readonly findBookmarkEditor: FindBookmarkEditor
  readonly listBookmarks: (
    input: { readonly userId: UserId } & BookmarkListQuery
  ) => Promise<BookmarkListItem[]>
  readonly getBookmarkDetail: (
    userId: UserId,
    input: { readonly id: string }
  ) => Promise<BookmarkDetail | null>
  readonly softDeleteBookmark: SoftDeleteBookmark
}

/**
 * HTTP 上の TouchTag 成功形。Application の branded `TagId` は載せない。
 */
export type TouchTagOutput = {
  readonly ok: true
}

/**
 * HTTP 上の CreateTag 成功形。Application の branded `TagId` は載せない。
 * brand は型システムの印で、JSON には残らない。client へ TagId を出すと、
 * 画面が Domain の組み立てを知っていることになってしまう。
 */
export type CreateTagOutput = {
  readonly id: number
}

/** HTTP 上の CreateBookmark 成功形。branded `BookmarkId` は wire output に残さない。 */
export type CreateBookmarkOutput = {
  readonly id: string
}

/**
 * HTTP 上の UpdateTag 成功形。branded `TagId` は載せない。
 * brand は型システムの印で、JSON には残らない。
 */
export type UpdateTagOutput = {
  readonly id: number
}

/** HTTP 上の UpdateBookmark 成功形。Application の branded `BookmarkId` は載せない。 */
export type UpdateBookmarkOutput = {
  readonly id: string
}

/**
 * 認証失敗は Result に入れない。回復できない拒否は oRPC の `UNAUTHORIZED` として投げる。
 * Application の既知エラーだけ 409 / 404 へ写す。想定外は包み直さず 500 に抜ける。
 */
export function createAppRouter(deps: AppRouterDeps) {
  const base = os.$context<{ headers: Headers }>().errors({
    UNAUTHORIZED: {
      status: 401
    },
    'tag-not-found': {
      status: 404
    }
  })
  const requireAuth = base.middleware(async ({ context, next, errors }) => {
    const session = await deps.getSession(context.headers)
    if (session == null) {
      throw errors.UNAUTHORIZED()
    }

    return next({
      context: {
        userId: v.parse(userIdSchema, session.id)
      }
    })
  })

  const auth = {
    /**
     * 未認証も 200 null で返す public procedure。redirect 判定は route 側で行う。
     */
    session: base.handler(async ({ context }) => {
      const user = await deps.getSession(context.headers)
      if (user == null) {
        return null
      }
      return { user }
    })
  }

  const createTag = base
    .use(requireAuth)
    .input(createTagInputSchema)
    .errors({
      'tag-name-already-exists': {
        status: 409
      }
    })
    .handler(async ({ input, context, errors }) => {
      const result = await executeCreateTag({
        insertTag: deps.insertTag,
        userId: context.userId as UserId,
        command: toCreateTagCommand(input)
      })

      if (!result.ok) {
        throw errors['tag-name-already-exists']()
      }

      const output: CreateTagOutput = {
        id: Number(result.value.id)
      }

      return output
    })
  const updateTag = base
    .use(requireAuth)
    .input(updateTagInputSchema)
    .errors({
      'tag-name-already-exists': {
        status: 409
      },
      'tag-not-found': {
        status: 404
      }
    })
    .handler(async ({ input, context, errors }) => {
      const result = await executeUpdateTag({
        updateTag: deps.updateTag,
        userId: context.userId as UserId,
        command: toUpdateTagCommand(input)
      })

      if (!result.ok) {
        if (result.error.code === 'tag-name-already-exists') {
          throw errors['tag-name-already-exists']()
        }
        if (result.error.code === 'tag-not-found') {
          throw errors['tag-not-found']()
        }
        throw new ORPCError('INTERNAL_SERVER_ERROR')
      }

      const output: UpdateTagOutput = {
        id: Number(result.value.id)
      }

      return output
    })

  const touchTag = base
    .use(requireAuth)
    .input(touchTagInputSchema)
    .errors({
      'tag-not-found': {
        status: 404
      }
    })
    .handler(async ({ input, context, errors }) => {
      const result = await executeTouchTag({
        touchTag: deps.touchTag,
        userId: context.userId as UserId,
        id: input.id
      })

      if (!result.ok) {
        throw errors['tag-not-found']()
      }

      const output: TouchTagOutput = {
        ok: true
      }

      return output
    })
  const createBookmark = base
    .use(requireAuth)
    .input(createBookmarkInputSchema)
    .errors({
      'duplicate-url': {
        status: 409
      },
      'invalid-tag': {
        status: 409
      }
    })
    .handler(async ({ input, context, errors }) => {
      const result = await executeCreateBookmark({
        insertBookmark: deps.insertBookmark,
        userId: context.userId as UserId,
        command: input
      })

      if (!result.ok) {
        if (result.error.code === 'duplicate-url') {
          throw errors['duplicate-url']()
        }
        throw errors['invalid-tag']()
      }

      const output: CreateBookmarkOutput = {
        id: result.value.id
      }

      return output
    })
  const updateBookmark = base
    .use(requireAuth)
    .input(updateBookmarkInputSchema)
    .errors({
      'duplicate-url': {
        status: 409
      },
      'invalid-tag': {
        status: 409
      },
      'bookmark-not-found': {
        status: 404
      }
    })
    .handler(async ({ input, context, errors }) => {
      const result = await executeUpdateBookmark({
        updateBookmark: deps.updateBookmark,
        userId: context.userId as UserId,
        command: input
      })

      if (!result.ok) {
        throw errors[result.error.code]()
      }

      const output: UpdateBookmarkOutput = {
        id: result.value.id
      }

      return output
    })
  const fetchTitle = base
    .use(requireAuth)
    .input(fetchPageTitleInputSchema)
    .errors({
      'url-not-allowed': {
        status: 400
      }
    })
    .handler(async ({ input, errors }) => {
      const result = await executeFetchPageTitle({
        fetchPageTitle: deps.fetchPageTitle,
        url: input.url
      })

      if (!result.ok) {
        throw errors['url-not-allowed']()
      }

      return result.value
    })
  const editor = base
    .use(requireAuth)
    .input(
      v.object({
        id: bookmarkIdSchema
      })
    )
    .errors({
      'bookmark-not-found': {
        status: 404
      }
    })
    .handler(async ({ input, context, errors }): Promise<BookmarkEditorOutput> => {
      const record = await deps.findBookmarkEditor(context.userId as UserId, input.id)

      if (record == null) {
        throw errors['bookmark-not-found']()
      }

      return record
    })

  const bookmarkListInputSchema = v.object({
    ...offsetPaginationQuerySchema.entries,
    q: v.optional(v.string()),
    tagNames: v.optional(v.pipe(v.array(v.string()), v.maxLength(20))),
    tagMode: v.picklist(['and', 'or']),
    sort: v.picklist(['newest', 'updated'])
  })
  /** Id は wire 上では UUID 文字列。空文字や任意文字列をここで拒否する。 */
  const bookmarkIdInputSchema = v.object({ id: v.pipe(v.string(), v.uuid()) })

  const listBookmarks = base
    .use(requireAuth)
    .input(bookmarkListInputSchema)
    .handler(async ({ input, context }) =>
      deps.listBookmarks({
        userId: context.userId as UserId,
        tagMode: input.tagMode,
        sort: input.sort,
        limit: input.limit,
        offset: input.offset,
        ...(input.q !== undefined ? { q: input.q } : {}),
        ...(input.tagNames !== undefined ? { tagNames: input.tagNames } : {})
      })
    )

  /**
   * Query service の対象なし null は、ここでだけ 404 defined error へ変換する。
   * DB 障害や不正な保存済み row は包み直さず 500 に抜ける。
   */
  const bookmarkDetail = base
    .use(requireAuth)
    .errors({
      'bookmark-not-found': {
        status: 404
      }
    })
    .input(bookmarkIdInputSchema)
    .handler(async ({ input, context, errors }) => {
      const detail = await deps.getBookmarkDetail(context.userId as UserId, { id: input.id })

      if (detail == null) {
        throw errors['bookmark-not-found']()
      }

      return detail
    })

  /** 成功なら plain string ID を wire へ返す。Application の判別子はここで消える。 */
  const deleteBookmark = base
    .use(requireAuth)
    .errors({
      'bookmark-not-found': {
        status: 404
      }
    })
    .input(bookmarkIdInputSchema)
    .handler(async ({ input, context, errors }) => {
      const result = await executeDeleteBookmark({
        softDeleteBookmark: deps.softDeleteBookmark,
        userId: context.userId as UserId,
        command: input
      })

      if (result.kind === 'bookmark-not-found') {
        throw errors['bookmark-not-found']()
      }

      return { id: result.id }
    })

  return {
    auth,
    tags: {
      create: createTag,
      update: updateTag,
      touch: touchTag,
      shelf: base
        .use(requireAuth)
        .handler(async ({ context }) => deps.listShelfTags(context.userId)),
      list: base
        .use(requireAuth)
        .input(offsetPaginationQuerySchema)
        .handler(async ({ input, context }) => deps.listTags(context.userId, input)),
      byId: base
        .use(requireAuth)
        .input(tagIdInputSchema)
        .errors({
          'tag-not-found': {
            status: 404
          }
        })
        .handler(async ({ input, context, errors }) => {
          const record = await deps.findTagById(context.userId, input.id)
          if (record == null) {
            throw errors['tag-not-found']()
          }
          return record
        })
    },
    bookmarks: {
      create: createBookmark,
      title: fetchTitle,
      update: updateBookmark,
      editor,
      list: listBookmarks,
      detail: bookmarkDetail,
      delete: deleteBookmark
    }
  }
}

/**
 * 本番 router の実装モジュールは import しない。
 * 型だけ共有し、client bundle に getDB / getAuth が混ざらないようにする。
 */
export type AppRouter = ReturnType<typeof createAppRouter>
