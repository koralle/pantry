import { os } from "@orpc/server";
import * as v from "valibot";

import { userIdSchema } from "../../features/auth/domain/auth-values";
import type { SessionUser } from "../../features/auth/domain/auth-values";

export type GetSession = (headers: Headers) => Promise<SessionUser | null>;

/**
 * 機能ごとの procedure が共有する builder と認証 middleware。
 *
 * 認証失敗は Result に入れない。回復できない拒否は oRPC の `UNAUTHORIZED` として投げる。
 * Application の既知エラーだけ 409 / 404 へ写す。想定外は包み直さず 500 に抜ける。
 */
export const createProcedureKit = (getSession: GetSession) => {
  const base = os.$context<{ headers: Headers }>().errors({
    UNAUTHORIZED: {
      status: 401,
    },
    "tag-not-found": {
      status: 404,
    },
  });
  const requireAuth = base.middleware(async ({ context, next, errors }) => {
    const session = await getSession(context.headers);
    if (session === null || session === undefined) {
      throw errors.UNAUTHORIZED();
    }

    return await next({
      context: {
        userId: v.parse(userIdSchema, session.id),
      },
    });
  });

  return { base, requireAuth };
};

export type ProcedureKit = ReturnType<typeof createProcedureKit>;
