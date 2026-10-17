import type { SessionUser } from "@pantry/api-contract/schemas/session-user";

import type { Auth } from "./create-auth";

/** 認証済みユーザー。contract の `SessionUser` と同じ形。 */
export type AuthenticatedUser = SessionUser;

/**
 * リクエストヘッダーからサインイン済みユーザーを解決する port。
 * 未認証は例外ではなく null で返し、procedure 側が `UNAUTHORIZED` へ写す。
 */
export type Authenticator = (
  headers: Headers
) => Promise<AuthenticatedUser | null>;

/** Better Auth の Cookie セッションを読む authenticator を作る。 */
export const cookieSessionAuthenticator = (auth: Auth): Authenticator => {
  const authenticate = async (
    headers: Headers
  ): Promise<AuthenticatedUser | null> => {
    const session = await auth.api.getSession({ headers });
    if (session === null) {
      return null;
    }

    return {
      email: session.user.email,
      id: session.user.id,
      name: session.user.name,
    };
  };

  return authenticate;
};

/**
 * authenticator を順に試し、最初に解決したユーザーを返す。
 *
 * 将来 MCP / Chrome 拡張 / Raycast 向けに OAuth の access token を Bearer で
 * 受ける authenticator をこの配列へ足す。OAuth の実装はまだここには無い。
 */
export const authenticateRequest = async (
  authenticators: readonly Authenticator[],
  headers: Headers
): Promise<AuthenticatedUser | null> => {
  const tryAuthenticator = async (
    index: number
  ): Promise<AuthenticatedUser | null> => {
    const authenticate = authenticators[index];
    if (authenticate === undefined) {
      return null;
    }

    const user = await authenticate(headers);
    if (user !== null) {
      return user;
    }

    return await tryAuthenticator(index + 1);
  };

  return await tryAuthenticator(0);
};
