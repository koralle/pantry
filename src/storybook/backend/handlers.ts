import { RPCHandler } from "@orpc/server/fetch";
import { http } from "msw/http";

import { createAppRouter } from "../../rpc/create-app-router";
import type { AppRouterDeps } from "../../rpc/create-app-router";

// storybook パッケージは "." に型を export していないため、internal の
// Parameters を拡張する（公開型ができたら移す。msw-storybook-addon と同じ流儀）。
declare module "storybook/internal/csf" {
  interface Parameters {
    backend?: Partial<AppRouterDeps>;
  }
}

/**
 * 本番の procedure をそのまま使い、port だけを Story のものへ差し替える。
 * 包み方、入力検証、defined error、認可は本番の経路が作る。
 */
export function createRpcHandler(backend: AppRouterDeps) {
  const handler = new RPCHandler(createAppRouter(backend));

  return http.post("/api/rpc/*", async ({ request }) => {
    const { matched, response } = await handler.handle(
      // SAFETY: MSW の StrictRequest と Workers の Request は実体が同じ。
      // 型だけが `cf` プロパティの出所（DOM / workerd）でずれている。
      request as unknown as Request,
      { context: { headers: request.headers }, prefix: "/api/rpc" }
    );

    return matched ? response : new Response(null, { status: 404 });
  });
}
