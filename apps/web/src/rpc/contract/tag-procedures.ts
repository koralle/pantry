import type { ProcedureKit } from "./procedure-kit";

/** 空の module を残すのは、他機能の移行 PR と衝突しないため（最終 PR で消す）。 */
// oxlint-disable-next-line typescript/no-generated-empty-object-type -- deps なしを表す空の object 型
export type TagsDeps = Record<never, never>;

export const createTagProcedures = (_kit: ProcedureKit, _deps: TagsDeps) =>
  ({}) satisfies Record<string, never>;
