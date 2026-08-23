import { ORPCError, os } from '@orpc/server'
import * as v from 'valibot'

import { userIdSchema } from '../features/auth/domain/auth-values'
import type { SessionUser, UserId } from '../features/auth/domain/auth-values'
import {
  createBookmarkInputSchema,
  executeCreateBookmark
} from '../features/bookmarks/application/create-bookmark'
import type { InsertBookmark } from '../features/bookmarks/application/create-bookmark'
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
      create: createBookmark
    }
  }
}

/**
 * 本番 router の実装モジュールは import しない。
 * 型だけ共有し、client bundle に getDB / getAuth が混ざらないようにする。
 */
export type AppRouter = ReturnType<typeof createAppRouter>
