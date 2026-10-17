import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { ContractRouterClient } from "@orpc/contract";
import type { ApiContract } from "@pantry/api-contract";

/** `packages/api-contract` から導出した `pantry-api` の client 型。 */
export type ApiClient = ContractRouterClient<ApiContract>;

/**
 * ブラウザ用の `pantry-api` client。同一 origin の `/rpc` へ普通に fetch し、
 * web の Worker entry が Service Binding で api へ転送する。Cookie はブラウザが付ける。
 * SSR からは呼ばない（SSR は `client.server.ts` を使う）。
 */
export const apiBrowserClient: ApiClient = createORPCClient(
  new RPCLink({
    // 呼び出し毎に解決する。module 評価時に window を触らない。
    url: () => `${globalThis.location.origin}/rpc`,
    // あとから差し替えられた global fetch（テストや Storybook の stub）を拾う。
    fetch: async (request, init) => await globalThis.fetch(request, init),
  })
);
