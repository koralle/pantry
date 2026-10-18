import { oc } from "@orpc/contract";

/**
 * error map に載せるのは、api が投げた `UNAUTHORIZED` を client で defined error にして、
 * web の client が sign-in へ戻せるようにするため。
 */
export const authed = oc.errors({ UNAUTHORIZED: { status: 401 } });
