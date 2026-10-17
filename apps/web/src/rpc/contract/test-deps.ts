import { stubBookmarksDeps } from "./bookmark-procedures.test-helpers";
import type { AppRouterDeps } from "./create-app-router";
import { stubTagsDeps } from "./tag-procedures.test-helpers";

/**
 * web の router テスト用の deps。各テストは確かめたい service だけを上書きする。
 * 機能ごとの stub は `*-procedures.test-helpers.ts` が持つ（pantry-api へ移した機能は空になる）。
 */
export const stubAppRouterDeps = (): AppRouterDeps => ({
  ...stubBookmarksDeps(),
  ...stubTagsDeps(),
  fetchPageTitle: async () => ({ kind: "unavailable" }),
  getSession: async () => ({
    email: "koralle@example.com",
    id: "user-1",
    name: "koralle",
  }),
});
