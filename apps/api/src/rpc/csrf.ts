import type { ApiContract } from "@pantry/api-contract";

/**
 * CSRF ヘッダー（`x-csrf-token`）を求めない procedure の allowlist。
 *
 * CSRF は「別サイトから状態を変えさせる」攻撃なので、副作用の無い読み取りだけを外す。
 * `health` と `me` は何も書き換えず、別サイトからは応答も読めない（CORS を許していない）。
 * ここで外しておくと、ヘッダーを付けない旧 web（deploy の切り替え中や deploy 失敗時）が
 * `me` で session を確かめ続けられ、api だけ先に出ても全画面が 403 で落ちない。
 *
 * 判定は完全一致で fail closed にする。ここに無い procedure（tags.* / bookmarks.* を含む今後の
 * すべて）はヘッダーが必須。副作用のある procedure をここへ足してはいけない。
 */
const csrfExemptProcedures: ReadonlySet<string> = new Set([
  "health",
  "me",
] satisfies readonly (keyof ApiContract)[]);

/** `path` が allowlist の procedure そのものなら true（入れ子や前方一致は認めない）。 */
export const isCsrfExemptProcedure = (path: readonly string[]): boolean => {
  const [name] = path;
  return (
    path.length === 1 && name !== undefined && csrfExemptProcedures.has(name)
  );
};
