import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { SimpleCsrfProtectionLinkPlugin } from "@orpc/client/plugins";
import type { ContractRouterClient } from "@orpc/contract";
import type { ApiContract } from "@pantry/api-contract";

/** `packages/api-contract` から導出した `pantry-api` の client 型。 */
export type ApiClient = ContractRouterClient<ApiContract>;

/** api を `x-csrf-token` 必須だった版へ戻しても壊れないよう、CSRF plugin を残している。 */
export const createApiBrowserLink = (
  options: Pick<ConstructorParameters<typeof RPCLink>[0], "interceptors"> = {}
) =>
  new RPCLink({
    ...options,
    // 呼び出し毎に解決する。module 評価時に window を触らない。
    url: () => `${globalThis.location.origin}/rpc`,
    // あとから差し替えられた global fetch（テストや Storybook の stub）を拾う。
    fetch: async (request, init) => await globalThis.fetch(request, init),
    plugins: [new SimpleCsrfProtectionLinkPlugin()],
  });

export const apiBrowserClient: ApiClient = createORPCClient(
  createApiBrowserLink()
);
