import { oc } from "@orpc/contract";

/**
 * サインインが必要な procedure の起点。未認証は `UNAUTHORIZED`（401）として宣言する。
 *
 * error map に載せておくと、api が投げた `UNAUTHORIZED` は client で defined error になり、
 * web の client が sign-in へ戻す（`error.defined && error.code === "UNAUTHORIZED"`）。
 */
export const authed = oc.errors({ UNAUTHORIZED: { status: 401 } });
