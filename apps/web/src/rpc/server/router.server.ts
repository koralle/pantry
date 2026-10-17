/**
 * 本番配線だけを置く。router 実装本体は `createAppRouter` 側に残し、
 * ブラウザから server-only の getDB / api client を import できないようにする。
 * 機能ごとの配線は `tag-deps.server.ts` / `bookmark-deps.server.ts` に置く。
 */
import { createApiServerClient } from "../../api/client.server";
import { forwardSetCookie } from "../../api/forward-set-cookie.server";
import { getSessionUser } from "../../features/auth/server/get-session-user.server";
import { fetchPageTitle } from "../../features/bookmarks/server/fetch-page-title.server";
import { createAppRouter } from "../contract/create-app-router";
import { bookmarksDeps } from "./bookmark-deps.server";
import { tagsDeps } from "./tag-deps.server";

export const appRouter = createAppRouter({
  ...bookmarksDeps,
  ...tagsDeps,
  fetchPageTitle: async (url) => await fetchPageTitle(url),
  // session の正本は pantry-api。受けたリクエストの Cookie で `me` を呼び、
  // session 延長の Set-Cookie はブラウザへのレスポンスへ引き継ぐ。
  getSession: async (headers) =>
    await getSessionUser(
      createApiServerClient(headers, { onSetCookie: forwardSetCookie })
    ),
});
