import { getRequestHeaders } from "@tanstack/react-start/server";

import { createApiServerLink } from "../../api/client.server";
import { forwardSetCookie } from "../../api/forward-set-cookie.server";

/**
 * SSR 中の pantry-api 呼び出し。headers は呼び出し毎に request context から読み、
 * api が返した Set-Cookie（session の延長）はブラウザへのレスポンスへ引き継ぐ。
 */
export const ssrApiLink = createApiServerLink(() => getRequestHeaders(), {
  onSetCookie: forwardSetCookie,
});
