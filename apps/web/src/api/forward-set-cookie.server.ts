import { getResponseHeaders } from "@tanstack/react-start/server";

/**
 * pantry-api の Set-Cookie を、いま処理中のリクエストのレスポンスへ追加する。
 *
 * TanStack Start は event のレスポンスヘッダーの Set-Cookie を最終レスポンス
 * （SSR の HTML、`/api/rpc/*` の server route のどちらも）へ足す。1 回の SSR で
 * 複数の procedure が session を引くことがあるため、同じ値は重ねない。
 * ストリーミングが始まった後の追加は届かないが、session は beforeLoad で先に引く。
 */
export const forwardSetCookie = (cookies: readonly string[]): void => {
  const headers = getResponseHeaders();
  const existing = new Set(headers.getSetCookie());

  for (const cookie of cookies) {
    if (!existing.has(cookie)) {
      headers.append("set-cookie", cookie);
      existing.add(cookie);
    }
  }
};
