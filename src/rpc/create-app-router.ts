import { os } from '@orpc/server'
import * as v from 'valibot'

import { userIdSchema } from '../features/auth/domain/auth-values'
import type { UserId } from '../features/auth/domain/auth-values'
import {
  createTagInputSchema,
  executeCreateTag,
  toCreateTagCommand
} from '../features/tags/application/create-tag'
import type { InsertTag } from '../features/tags/application/create-tag'
import {
  executeUpdateTag,
  toUpdateTagCommand,
  updateTagInputSchema
} from '../features/tags/application/update-tag'
import type { UpdateTag } from '../features/tags/application/update-tag'

type RpcSession = {
  readonly user: {
    readonly id: string
  }
}

type GetSession = (headers: Headers) => Promise<RpcSession | null>

/**
 * 本番の Better Auth / Drizzle をここに閉じ込めるための差し込み口。
 * RPC テストは session と永続化処理を差し替え、Turso を立てずに契約だけを叩く。
 */
export type AppRouterDeps = {
  readonly getSession: GetSession
  readonly insertTag: InsertTag
  readonly updateTag: UpdateTag
}

/**
 * HTTP 上の CreateTag 成功形。Application の branded `TagId` は載せない。
 * brand は型システムの印で、JSON には残らない。client へ TagId を出すと、
 * 画面が Domain の組み立てを知っていることになってしまう。
 */
export type CreateTagOutput = {
  readonly id: number
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
    }
  })
  const requireAuth = base.middleware(async ({ context, next, errors }) => {
    const session = await deps.getSession(context.headers)
    if (session == null) {
      throw errors.UNAUTHORIZED()
    }

    return next({
      context: {
        userId: v.parse(userIdSchema, session.user.id)
      }
    })
  })
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
        throw errors['tag-not-found']()
      }

      const output: UpdateTagOutput = {
        id: Number(result.value.id)
      }

      return output
    })

  return {
    tags: {
      create: createTag,
      update: updateTag
    }
  }
}

/**
 * 本番 router の実装モジュールは import しない。
 * 型だけ共有し、client bundle に getDB / getAuth が混ざらないようにする。
 */
export type AppRouter = ReturnType<typeof createAppRouter>
