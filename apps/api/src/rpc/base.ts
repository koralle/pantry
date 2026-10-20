import { ORPCError, implement } from "@orpc/server";
import type { ResponseHeadersPluginContext } from "@orpc/server/plugins";
import { contract } from "@pantry/api-contract";
import type { AppDb } from "@pantry/db";
import * as v from "valibot";

import type { Authenticator } from "../auth/session";
import { userIdSchema } from "../domain/user-id";

export type RpcContext = { headers: Headers } & ResponseHeadersPluginContext;

/** テストで stub と使い捨ての DB に差し替えるため注入する。 */
export interface RouterDeps {
  readonly authenticate: Authenticator;
  /** isolate ごとに遅延生成するため関数で受ける。 */
  readonly db: () => AppDb;
}

const createImplementer = () => implement(contract).$context<RpcContext>();

type Implementer = ReturnType<typeof createImplementer>;

const createRequireAuth = (impl: Implementer, deps: RouterDeps) =>
  impl.middleware(async ({ context, next }) => {
    const user = await deps.authenticate(context.headers, context.resHeaders);
    if (user === null) {
      // 共有 middleware では `errors.UNAUTHORIZED` を型付けできない（health は宣言しない）。
      // contract の `authed` が宣言しているので、client ではこれでも defined error になる。
      throw new ORPCError("UNAUTHORIZED");
    }

    return await next({
      context: { user, userId: v.parse(userIdSchema, user.id) },
    });
  });

/**
 * DB を execution context へ載せる。ここでは生成せず `deps.db()`（isolate 単位のキャッシュ）を
 * 渡すだけなので、この middleware は接続のライフサイクルを持たない。
 *
 * 単体で `.use()` しない。`requireAuthWithDb` が `requireAuth` の**後**に連結する。
 * 先に置くと、env 不備の 500 が未認証の 401 を覆い隠す。
 */
const createWithDb = (impl: Implementer, deps: RouterDeps) =>
  impl.middleware(
    async ({ next }) => await next({ context: { db: deps.db() } })
  );

// `prefer-spread` は配列向けの規則。oRPC の middleware 連結は配列ではなくメソッドで、
// `.use()` 2 回に崩すと順序（認証 → DB）が型で守られなくなる。
const createRequireAuthWithDb = (impl: Implementer, deps: RouterDeps) =>
  // oxlint-disable-next-line prefer-spread
  createRequireAuth(impl, deps).concat(createWithDb(impl, deps));

export interface RouterKit {
  readonly impl: Implementer;
  /** 認証だけ。DB を触らない procedure（`me`）向け。 */
  readonly requireAuth: ReturnType<typeof createRequireAuth>;
  /**
   * 認証 + DB。`context.user` / `context.userId` / `context.db` が入る。
   * 順序を型ではなく構造で固定するため、2 つを `concat` して 1 本にしてある
   * （逆順の `.use(withDb).use(requireAuth)` は型検査を通ってしまう）。
   * `health` には付けない。DB を触らない procedure を DB の env に依存させないため。
   */
  readonly requireAuthWithDb: ReturnType<typeof createRequireAuthWithDb>;
}

export const createRouterKit = (deps: RouterDeps): RouterKit => {
  const impl = createImplementer();
  return {
    impl,
    requireAuth: createRequireAuth(impl, deps),
    requireAuthWithDb: createRequireAuthWithDb(impl, deps),
  };
};
