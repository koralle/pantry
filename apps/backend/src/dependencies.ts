import type { Context } from "hono";
import type { BookmarksService } from "./services/bookmarks";
import type { TagsService } from "./services/tags";

export interface AppDependencies {
  bookmarksService: BookmarksService;
  tagsService: TagsService;
}

export type AppEnv = {
  Bindings: CloudflareBindings;
  Variables: AppDependencies;
};

export const getAppDependency = <Key extends keyof AppDependencies>(
  c: Context,
  key: Key,
): AppDependencies[Key] => {
  const dependency = c.get(key as string);

  if (dependency == null) {
    throw new Error(`Dependency "${String(key)}" is not configured`);
  }

  return dependency as AppDependencies[Key];
};
