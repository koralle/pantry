import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { SimpleCsrfProtectionLinkPlugin } from "@orpc/client/plugins";
import { env } from "cloudflare:workers";

import type { ApiClient } from "./client";

/**
 * Service Binding 越しの URL は origin を使わず、パスだけが api の `/rpc` prefix に効く。
 */
const API_RPC_URL = "https://pantry-api.internal/rpc";

/**
 * 元リクエストから api へ引き継ぐヘッダー。Cookie（session）と、Better Auth が
 * クライアント IP を読むヘッダー（apps/api の clientIpHeaders）。X-Forwarded-For は
 * api が本番では読まないので、常に転送しても害はない。SSR の direct client と
 * ssrRpcFetch はどちらも procedure の context へこれらを引き継ぐ。
 */
const FORWARDED_HEADERS = [
  "cookie",
  "cf-connecting-ip",
  "x-forwarded-for",
] as const;

type ApiFetch = (request: Request) => Promise<Response>;

const bindingFetch: ApiFetch = async (request) => await env.API.fetch(request);

export interface ApiServerClientOptions {
  /** 既定は `env.API.fetch`（Service Binding）。テストは fake を渡す。 */
  readonly apiFetch?: ApiFetch;
  /**
   * api が返した Set-Cookie（session の延長や失効）を受け取る。SSR では
   * ブラウザへのレスポンスへ引き継ぐ（`forwardSetCookie`）。
   */
  readonly onSetCookie?: (cookies: readonly string[]) => void;
}

const pickForwardedHeaders = (incoming: Headers): Record<string, string> =>
  Object.fromEntries(
    FORWARDED_HEADERS.flatMap((name) => {
      const value = incoming.get(name);
      return value === null || value === "" ? [] : [[name, value]];
    })
  );

/**
 * `incoming` を呼び出し毎に解決するのは、SSR では request ごとに headers が変わるため。
 * CSRF plugin は、api が CSRF 対策で `x-csrf-token` を要求するため。
 */
export const createApiServerLink = (
  incoming: () => Headers,
  { apiFetch = bindingFetch, onSetCookie }: ApiServerClientOptions = {}
) =>
  new RPCLink({
    fetch: async (request) => {
      const response = await apiFetch(request);
      const cookies = response.headers.getSetCookie();
      if (cookies.length > 0) {
        onSetCookie?.(cookies);
      }
      return response;
    },
    headers: () => pickForwardedHeaders(incoming()),
    plugins: [new SimpleCsrfProtectionLinkPlugin()],
    url: API_RPC_URL,
  });

export const createApiServerClient = (
  incoming: Headers,
  options: ApiServerClientOptions = {}
): ApiClient => createORPCClient(createApiServerLink(() => incoming, options));
