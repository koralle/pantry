import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { env } from "cloudflare:workers";

import type { ApiClient } from "./client";

/**
 * Service Binding 越しの URL は origin を使わず、パスだけが api の `/rpc` prefix に効く。
 */
const API_RPC_URL = "https://pantry-api.internal/rpc";

/**
 * 元リクエストから api へ引き継ぐヘッダー。Cookie（session）と、Better Auth が
 * クライアント IP を読むヘッダー（apps/api の CLIENT_IP_HEADERS）。
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
 * SSR / server function 用の `pantry-api` client。受けたリクエストの Cookie と
 * クライアント IP のヘッダーだけを転送し、api の Set-Cookie は `onSetCookie` へ渡す。
 */
export const createApiServerClient = (
  incoming: Headers,
  { apiFetch = bindingFetch, onSetCookie }: ApiServerClientOptions = {}
): ApiClient =>
  createORPCClient(
    new RPCLink({
      fetch: async (request) => {
        const response = await apiFetch(request);
        const cookies = response.headers.getSetCookie();
        if (cookies.length > 0) {
          onSetCookie?.(cookies);
        }
        return response;
      },
      headers: () => pickForwardedHeaders(incoming),
      url: API_RPC_URL,
    })
  );
