import { isDefinedError, safe } from "@orpc/client";

import type { ApiClient } from "../../../api/client";
import type { SessionUser } from "../domain/auth-values";

/**
 * `pantry-api` の `me` から session を引く。未認証（`UNAUTHORIZED`）は null、
 * それ以外の失敗（api の障害など）は未認証と区別するため例外のまま投げる。
 */
export const getSessionUser = async (
  client: ApiClient
): Promise<SessionUser | null> => {
  const [error, user] = await safe(client.me());

  if (error === null) {
    return user;
  }

  if (isDefinedError(error) && error.code === "UNAUTHORIZED") {
    return null;
  }

  throw error;
};
