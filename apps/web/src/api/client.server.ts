import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { env } from "cloudflare:workers";

import type { ApiClient } from "./client";

/**
 * Service Binding 越しの URL は origin を使わず、パスだけが api の `/rpc` prefix に効く。
 */
const API_RPC_URL = "https://pantry-api.internal/rpc";

type ApiFetch = (request: Request) => Promise<Response>;

const bindingFetch: ApiFetch = async (request) => await env.API.fetch(request);

/**
 * SSR / server function 用の `pantry-api` client。fetch は `env.API.fetch`
 * （Service Binding）で、受けたリクエストの Cookie だけを転送する。
 */
export const createApiServerClient = (
  cookie: string | null | undefined,
  apiFetch: ApiFetch = bindingFetch
): ApiClient =>
  createORPCClient(
    new RPCLink({
      fetch: async (request) => await apiFetch(request),
      headers: (): Record<string, string> =>
        cookie === null || cookie === undefined || cookie === ""
          ? {}
          : { cookie },
      url: API_RPC_URL,
    })
  );
