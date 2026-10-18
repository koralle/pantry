import { DynamicLink } from "@orpc/client";
import type { ClientContext, ClientLink } from "@orpc/client";
import { isContractProcedure } from "@orpc/contract";
import type { ContractRouterClient } from "@orpc/contract";
import type { RouterClient } from "@orpc/server";
import { contract } from "@pantry/api-contract";
import type { ApiContract } from "@pantry/api-contract";

import type { AppRouter } from "../contract/create-app-router";

/**
 * web の AppRouter と ApiContract をひとつにするのは、procedure を api へ移しても
 * `orpc.tags.*` などの呼び出しと TanStack Query の key を変えないため。
 */
export type AppClient = RouterClient<AppRouter> &
  ContractRouterClient<ApiContract>;

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

/** contract で振り分けるのは、移行を contract へ procedure を足すだけで切り替えるため。 */
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
