import { ORPCError, implement } from "@orpc/server";
import type { ResponseHeadersPluginContext } from "@orpc/server/plugins";
import { contract } from "@pantry/api-contract";
import type { AppDb } from "@pantry/db";
import * as v from "valibot";

import type { Authenticator } from "../auth/session";
import { userIdSchema } from "../domain/user-id";

/** RPCHandler が procedure へ渡す context。resHeaders は app.ts の ResponseHeadersPlugin が用意する。 */
export type RpcContext = { headers: Headers } & ResponseHeadersPluginContext;

/** Router が依存する能力。テストは stub と使い捨ての DB を差し込む。 */
export interface RouterDeps {
  readonly authenticate: Authenticator;
  /** 機能の procedure が使う DB。isolate ごとに遅延生成するので関数で受ける。 */
  readonly db: () => AppDb;
}

const createImplementer = () => implement(contract).$context<RpcContext>();

type Implementer = ReturnType<typeof createImplementer>;

/**
 * 未認証を `UNAUTHORIZED`（401）へ写し、認証済みの `user` と所有者の絞り込みに使う
 * `userId` を context へ足す middleware。
 */
const createRequireAuth = (impl: Implementer, deps: RouterDeps) =>
  impl.middleware(async ({ context, next }) => {
    const user = await deps.authenticate(context.headers, context.resHeaders);
    if (user === null) {
      // router 共有の middleware からは procedure ごとの `errors` を型付けできない（health は
      // UNAUTHORIZED を宣言しない）。認証が要る procedure は contract の `authed` で
      // UNAUTHORIZED（401）を宣言しているので、oRPC が client 向けに defined error として返す。
      throw new ORPCError("UNAUTHORIZED");
    }

    return await next({
      context: { user, userId: v.parse(userIdSchema, user.id) },
    });
  });

/** 機能ごとの router を組み立てる部品。機能のファイルは `kit.impl.<namespace>` から実装する。 */
export interface RouterKit {
  readonly impl: Implementer;
  readonly requireAuth: ReturnType<typeof createRequireAuth>;
  readonly deps: RouterDeps;
}

export const createRouterKit = (deps: RouterDeps): RouterKit => {
  const impl = createImplementer();
  return { deps, impl, requireAuth: createRequireAuth(impl, deps) };
};
