import type { ProcedureKit } from "./procedure-kit";

/** 空の module を残すのは、他機能の移行 PR と衝突しないため（最終 PR で消す）。 */
export type BookmarksDeps = Record<never, never>;

export const createBookmarkProcedures = (
  _kit: ProcedureKit,
  _deps: BookmarksDeps
) => ({}) satisfies Record<string, never>;
