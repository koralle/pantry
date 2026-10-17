/**
 * 共有 Result は ok / err だけに留める。
 * map / match / andThen などを足すとユースケース固有のエラー処理が
 * ライブラリ都合に引きずられやすくなるため、分岐は呼び出し側の
 * 明示的な `if (!result.ok)` に任せる。
 */
export type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export const ok = <T = void>(value?: T): Result<T, never> =>
  // SAFETY: omitted value is the Result<void> success payload.
  ({ ok: true, value: value as T });

export const err = <E>(error: E): Result<never, E> => ({ error, ok: false });
