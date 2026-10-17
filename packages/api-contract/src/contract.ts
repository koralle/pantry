import { oc } from "@orpc/contract";
import * as v from "valibot";

import { authed } from "./base";
import { bookmarksContract } from "./bookmarks";
import { sessionUserSchema } from "./schemas/session-user";
import { tagsContract } from "./tags";

/**
 * Pantry API の正本となる contract。
 *
 * - 実装は `apps/api`（Cloudflare Worker `pantry-api`）
 * - 認証は Better Auth の Cookie セッション。サインインが必要な procedure は `authed` から作り、
 *   `UNAUTHORIZED`（401）を宣言する
 * - ブラウザからは `apps/web` の `/rpc/*` を経由し、web が Service Binding で転送する
 * - 機能ごとの procedure は `tags.ts` / `bookmarks.ts` に置く（機能単位の PR が互いのファイルを触らない）
 */
export const contract = {
  bookmarks: bookmarksContract,
  health: oc.output(v.object({ status: v.literal("ok") })),
  me: authed.output(sessionUserSchema),
  tags: tagsContract,
};

export type ApiContract = typeof contract;
