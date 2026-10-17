import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { SimpleCsrfProtectionLinkPlugin } from "@orpc/client/plugins";
import type { ContractRouterClient } from "@orpc/contract";
import type { ApiContract } from "@pantry/api-contract";

/** `packages/api-contract` から導出した `pantry-api` の client 型。 */
export type ApiClient = ContractRouterClient<ApiContract>;

/**
 * ブラウザから `pantry-api` を呼ぶ link。同一 origin の `/rpc` へ普通に fetch し、
 * web の Worker entry が Service Binding で api へ転送する。Cookie はブラウザが付ける。
 * api は CSRF 対策で `x-csrf-token` を要求するので、SimpleCsrfProtectionLinkPlugin で付ける。
 * SSR からは使わない（SSR は `client.server.ts` の link を使う）。
 */
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

/** ブラウザ用の `pantry-api` client。 */
export const apiBrowserClient: ApiClient = createORPCClient(
  createApiBrowserLink()
);
