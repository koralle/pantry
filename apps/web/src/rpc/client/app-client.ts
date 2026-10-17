import { DynamicLink } from "@orpc/client";
import type { ClientContext, ClientLink } from "@orpc/client";
import { isContractProcedure } from "@orpc/contract";
import type { ContractRouterClient } from "@orpc/contract";
import type { RouterClient } from "@orpc/server";
import { contract } from "@pantry/api-contract";
import type { ApiContract } from "@pantry/api-contract";

import type { AppRouter } from "../contract/create-app-router";

/**
 * 画面から見た oRPC client。web の `/api/rpc`（AppRouter）と `pantry-api`（ApiContract）を
 * ひとつにまとめる。procedure を api へ移しても `orpc.tags.*` などの呼び出しと
 * TanStack Query の key は変わらない。
 */
export type AppClient = RouterClient<AppRouter> &
  ContractRouterClient<ApiContract>;

/** `path` が `@pantry/api-contract` の procedure なら true。 */
export const isApiProcedurePath = (path: readonly string[]): boolean => {
  let node: unknown = contract;
  for (const key of path) {
    if (
      typeof node !== "object" ||
      node === null ||
      !Object.hasOwn(node, key)
    ) {
      return false;
    }
    node = (node as Record<string, unknown>)[key];
  }
  return isContractProcedure(node);
};

/**
 * api の contract にある procedure は `api` link（pantry-api）へ、それ以外は `web` link
 * （web の `/api/rpc`）へ振り分ける。移行は contract へ procedure を足すだけで切り替わる。
 */
export const createAppLink = <T extends ClientContext>(links: {
  readonly api: ClientLink<T> | (() => Promise<ClientLink<T>>);
  readonly web: ClientLink<T>;
}): DynamicLink<T> =>
  new DynamicLink<T>(async (_options, path) => {
    if (!isApiProcedurePath(path)) {
      return links.web;
    }
    return typeof links.api === "function" ? await links.api() : links.api;
  });
