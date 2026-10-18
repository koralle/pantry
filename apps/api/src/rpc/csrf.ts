import type { ApiContract } from "@pantry/api-contract";

/**
 * CSRF は「別サイトから状態を変えさせる」攻撃なので、副作用の無い読み取りだけを外す。
 * `health` と `me` は何も書き換えず、別サイトからは応答も読めない（CORS を許していない）。
 * ここで外しておくと、ヘッダーを付けない旧 web（deploy の切り替え中や deploy 失敗時）が
 * `me` で session を確かめ続けられ、api だけ先に出ても全画面が 403 で落ちない。
 *
 * 完全一致にするのは、ここに無い procedure（今後足すものを含む）を必ず検査させる（fail closed）ため。
 * 副作用のある procedure を足すと、その procedure の CSRF 対策が無くなる。
 */
const csrfExemptProcedures: ReadonlySet<string> = new Set([
  "health",
  "me",
] satisfies readonly (keyof ApiContract)[]);

export const isCsrfExemptProcedure = (path: readonly string[]): boolean => {
  const [name] = path;
  return (
    path.length === 1 && name !== undefined && csrfExemptProcedures.has(name)
  );
};
