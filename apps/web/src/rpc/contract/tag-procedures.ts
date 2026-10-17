import type { ProcedureKit } from "./procedure-kit";

/**
 * `tags.*` は pantry-api（`@pantry/api-contract` の `tags`）へ移した。
 * DynamicLink が contract にある path を api へ送るので、web の router には残さない。
 * 空の module は他機能の移行 PR と衝突しないために置いており、最終 PR で消す。
 */
export type TagsDeps = Record<never, never>;

export const createTagProcedures = (_kit: ProcedureKit, _deps: TagsDeps) =>
  ({}) satisfies Record<string, never>;
