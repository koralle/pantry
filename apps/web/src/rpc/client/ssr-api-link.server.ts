import { getRequestHeaders } from "@tanstack/react-start/server";

import { createApiServerLink } from "../../api/client.server";
import { forwardSetCookie } from "../../api/forward-set-cookie.server";

/** request ごとに headers が変わるため、呼び出し毎に request context から読む。 */
export const ssrApiLink = createApiServerLink(() => getRequestHeaders(), {
  onSetCookie: forwardSetCookie,
});
