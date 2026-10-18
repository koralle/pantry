import { createORPCClient, ORPCError, onError } from "@orpc/client";
import type { ClientLink } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createIsomorphicFn } from "@tanstack/react-start";

import { createApiBrowserLink } from "../../api/client";
import { createAppLink } from "./app-client";
import type { AppClient } from "./app-client";

const rpcFetch = createIsomorphicFn()
  .server(async (request: Request, _init?: RequestInit) => {
    const { ssrRpcFetch } = await import("../server/ssr-rpc-fetch.server");
    return await ssrRpcFetch(request);
  })
  .client(
    async (request: Request, init?: RequestInit) =>
      await globalThis.fetch(request, init)
  );

const redirectToSignIn = (): void => {
  if (typeof window === "undefined") {
    return;
  }

  const redirect = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const signIn = new URL("/sign-in/", window.location.origin);
  signIn.searchParams.set("redirect", redirect);
  window.location.replace(signIn);
};

const redirectOnUnauthorized = (error: unknown): void => {
  if (
    error instanceof ORPCError &&
    error.defined &&
    error.code === "UNAUTHORIZED"
  ) {
    redirectToSignIn();
  }
};

const webLink = new RPCLink({
  url: () => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/api/rpc`;
    }

    // SSR では url を使わない。rpcFetch の server 実装が process 内の handler へ直接流す。
    return "http://pantry.internal/api/rpc";
  },
  // 呼び出し毎に解決する。構築時に bind すると、あとから差し替えられた
  // global fetch（テストや Storybook の stub）を拾えない。
  fetch: async (request, init) => await rpcFetch(request, init),
  interceptors: [onError(redirectOnUnauthorized)],
});

const browserApiLink = createApiBrowserLink({
  interceptors: [onError(redirectOnUnauthorized)],
});

/**
 * server と client で link を分けるのは、SSR には同一 origin の `/rpc` が無く、
 * api の Set-Cookie（session の延長）もブラウザへのレスポンスへ引き継ぐ必要があるため。
 */
const apiLink = createIsomorphicFn()
  .server(async (): Promise<ClientLink<Record<never, never>>> => {
    const { ssrApiLink } = await import("./ssr-api-link.server");
    return ssrApiLink;
  })
  .client(
    async (): Promise<ClientLink<Record<never, never>>> =>
      await Promise.resolve(browserApiLink)
  );

export const rpcClient: AppClient = createORPCClient(
  createAppLink({ api: apiLink, web: webLink })
);
