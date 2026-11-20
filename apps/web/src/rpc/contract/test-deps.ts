import { stubBookmarksDeps } from "./bookmark-procedures.test-utils";
import type { AppRouterDeps } from "./create-app-router";
import { stubTagsDeps } from "./tag-procedures.test-utils";

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
