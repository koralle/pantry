import { oc } from "@orpc/contract";
import * as v from "valibot";

import { sessionUserSchema } from "./schemas/session-user";

/**
 * Pantry API の正本となる contract。
 *
 * - 実装は `apps/api`（Cloudflare Worker `pantry-api`）
 * - 認証は Better Auth の Cookie セッション。`me` は `UNAUTHORIZED`（401）を宣言する
 * - ブラウザからは `apps/web` の `/rpc/*` を経由し、web が Service Binding で転送する
 */
export const contract = {
  health: oc.output(v.object({ status: v.literal("ok") })),
  me: oc.errors({ UNAUTHORIZED: { status: 401 } }).output(sessionUserSchema),
};

export type ApiContract = typeof contract;
