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

export interface RouterKit {
  readonly impl: Implementer;
  readonly requireAuth: ReturnType<typeof createRequireAuth>;
  readonly deps: RouterDeps;
}

export const createRouterKit = (deps: RouterDeps): RouterKit => {
  const impl = createImplementer();
  return { deps, impl, requireAuth: createRequireAuth(impl, deps) };
};
