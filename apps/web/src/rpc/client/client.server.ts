import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { getRequestHeaders } from "@tanstack/react-start/server";

import { createApiServerLink } from "../../api/client.server";
import { forwardSetCookie } from "../../api/forward-set-cookie.server";
import type { AppRouter } from "../contract/create-app-router";
import { handleRpcRequest } from "../server/handle-request.server";
import { createAppLink } from "./app-client";
import type { AppClient } from "./app-client";

/** web link の URL は prefix 判定のためだけにあり、実際には fetch されない。 */
export const createServerRpcClient = (
  headersProvider: () => Headers,
  router?: AppRouter
): AppClient => {
  const webLink = new RPCLink({
    fetch: async (request) => await handleRpcRequest(request, router),
    headers: headersProvider,
    url: "http://pantry.internal/api/rpc",
  });
  const apiLink = createApiServerLink(headersProvider, {
    onSetCookie: forwardSetCookie,
  });

  return createORPCClient(createAppLink({ api: apiLink, web: webLink }));
};

/**
 * Request context の外で生成しない。headers provider は呼び出し毎に解決する。
 */
export const serverRpcClient = createServerRpcClient(() => getRequestHeaders());
