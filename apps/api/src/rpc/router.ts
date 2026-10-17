import { ORPCError, implement } from "@orpc/server";
import { contract } from "@pantry/api-contract";

import type { Authenticator } from "../auth/session";

/** Router が依存する能力。テストは stub を差し込む。 */
export interface RouterDeps {
  readonly authenticate: Authenticator;
}

/**
 * contract を実装した oRPC router を作る。
 *
 * `health` は認証なし。`me` は requireAuth middleware を通し、
 * 未認証を contract の型付きエラー `UNAUTHORIZED`（401）へ写す。
 */
export const createRouter = (deps: RouterDeps) => {
  const base = implement(contract).$context<{ headers: Headers }>();
  const requireAuth = base.middleware(async ({ context, next }) => {
    const user = await deps.authenticate(context.headers);
    if (user === null) {
      // contract の型付きエラーは `me` だけが宣言しているため、router 共有の
      // middleware からは `errors.UNAUTHORIZED()` を型付けできない。
      // `UNAUTHORIZED` の既定 status は 401 で、`me` の errorMap とも一致する。
      throw new ORPCError("UNAUTHORIZED");
    }

    return await next({ context: { user } });
  });

  return base.router({
    health: base.health.handler(() => ({ status: "ok" })),
    me: base.me.use(requireAuth).handler(({ context }) => context.user),
  });
};
