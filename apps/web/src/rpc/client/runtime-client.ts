import { createIsomorphicFn } from "@tanstack/react-start";

import type { AppClient } from "./app-client";
import { rpcClient } from "./client";

/**
 * Loader / beforeLoad は SSR でも client navigation でも走る。
 * server では request headers を載せた direct client、browser では既存 rpcClient を使う。
 * server 実装は compiler が client bundle から落とすため、
 * client.server や Better Auth server が browser へ流れない。
 */
export const getRpcClient = createIsomorphicFn()
  .server(async (): Promise<AppClient> => {
    const { serverRpcClient } = await import("./client.server");
    return serverRpcClient;
  })
  .client(async (): Promise<AppClient> => rpcClient);
