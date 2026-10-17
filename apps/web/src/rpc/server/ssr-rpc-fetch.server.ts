import { getRequestHeaders } from "@tanstack/react-start/server";

import type { AppRouter } from "../contract/create-app-router";
import { handleRpcRequest } from "./handle-request.server";

/**
 * 元リクエストから procedure の context へ引き継ぐヘッダー。Cookie（session）と、
 * getSession が pantry-api へそのまま転送するクライアント IP のヘッダー
 * （api/client.server.ts の FORWARDED_HEADERS と揃える）。X-Forwarded-For は
 * api 側が本番では読まないので、常に引き継いでも害はない。
 */
const INCOMING_HEADERS = ["cookie", "cf-connecting-ip", "x-forwarded-for"];

/**
 * SSR 中の oRPC 呼び出しを、HTTP 往復なしで同じ process の RPC handler へ流す。
 * ブラウザの RPCLink と同一の契約（procedure・status・TanStack Query key）を使うため、
 * loader / component は実行環境を意識しない。Cookie とクライアント IP のヘッダーは
 * 元リクエストから転送する（link が明示的に載せた値は上書きしない）。
 */
export const ssrRpcFetch = async (
  request: Request,
  router?: AppRouter
): Promise<Response> => {
  const headers = new Headers(request.headers);
  const incoming = getRequestHeaders();

  for (const name of INCOMING_HEADERS) {
    const value = incoming.get(name);
    if (value !== null && value !== "" && !headers.has(name)) {
      headers.set(name, value);
    }
  }

  const body =
    request.method === "GET" ? undefined : await request.arrayBuffer();

  return await handleRpcRequest(
    new Request(request.url, {
      headers,
      method: request.method,
      ...(body === undefined ? {} : { body }),
    }),
    router
  );
};
