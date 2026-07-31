/**
 * 共有 Result は ok / err だけに留める。
 * map / match / andThen などを足すとユースケース固有のエラー処理が
 * ライブラリ都合に引きずられやすくなるため、分岐は呼び出し側の
 * 明示的な `if (!result.ok)` に任せる。
 */
export type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E }

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value }
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error }
}
