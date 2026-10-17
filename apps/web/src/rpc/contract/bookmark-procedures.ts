import type { ProcedureKit } from "./procedure-kit";

/**
 * `bookmarks.*`（`title` 以外）は pantry-api（`@pantry/api-contract` の `bookmarks`）へ移した。
 * DynamicLink が contract にある path を api へ送るので、web の router には残さない。
 * 空の module は他機能の移行 PR と衝突しないために置いており、最終 PR で消す。
 */
export type BookmarksDeps = Record<never, never>;

export const createBookmarkProcedures = (
  _kit: ProcedureKit,
  _deps: BookmarksDeps
) => ({}) satisfies Record<string, never>;
