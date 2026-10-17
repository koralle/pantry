import { oc } from "@orpc/contract";
import * as v from "valibot";

import { sessionUserSchema } from "./schemas/session-user";

/**
 * Pantry API の正本となる contract。
 *
 * - 実装は `apps/api`（Cloudflare Worker `pantry-api`）
 * - 認証は Better Auth の Cookie セッション。`me` は `UNAUTHORIZED`（401）を宣言する
 * - ブラウザからの経路は PR 3 で `apps/web` の Service Binding 経由になる
 *   （本 PR では web の `/api/rpc` と web 自身の Better Auth が動き続ける）
 */
export const contract = {
  health: oc.output(v.object({ status: v.literal("ok") })),
  me: oc.errors({ UNAUTHORIZED: { status: 401 } }).output(sessionUserSchema),
};

export type ApiContract = typeof contract;
