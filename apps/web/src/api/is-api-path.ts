/**
 * `pantry-api` Worker へ Service Binding で転送するパス。
 *
 * `/api/rpc/*` は web 自身の oRPC（移行中の既存機能）なので含めない。
 */
const API_PATH_PREFIXES = ["/rpc/", "/api/auth/"] as const;

export const isApiPath = (pathname: string): boolean =>
  API_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
