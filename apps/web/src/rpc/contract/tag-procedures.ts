import type { ProcedureKit } from "./procedure-kit";

/** 空の module を残すのは、他機能の移行 PR と衝突しないため（最終 PR で消す）。 */
export type TagsDeps = Record<never, never>;

export const createTagProcedures = (_kit: ProcedureKit, _deps: TagsDeps) =>
  ({}) satisfies Record<string, never>;
