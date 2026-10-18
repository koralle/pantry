import { oc } from "@orpc/contract";
import * as v from "valibot";

import { authed } from "./base";
import { bookmarksContract } from "./bookmarks";
import { sessionUserSchema } from "./schemas/session-user";
import { tagsContract } from "./tags";

/** 機能ごとの procedure を `tags.ts` / `bookmarks.ts` に分けるのは、機能単位の PR が互いのファイルを触らないため。 */
export const contract = {
  bookmarks: bookmarksContract,
  health: oc.output(v.object({ status: v.literal("ok") })),
  me: authed.output(sessionUserSchema),
  tags: tagsContract,
};

export type ApiContract = typeof contract;
