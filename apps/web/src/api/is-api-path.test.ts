import { describe, expect, test } from "vitest";

import { isApiPath } from "./is-api-path";

describe("isApiPath", () => {
  test.each([
    "/rpc/health",
    "/rpc/me",
    "/api/auth/get-session",
    "/api/auth/sign-in/email",
    "/api/auth/passkey/generate-authenticate-options",
  ])("%s は api へ転送する", (pathname) => {
    expect(isApiPath(pathname)).toBe(true);
  });

  test.each([
    "/",
    "/bookmarks",
    "/rpc",
    "/rpcx/health",
    "/api/rpc/auth/session",
    "/api/auth",
    "/sign-in/",
  ])("%s は web が処理する", (pathname) => {
    expect(isApiPath(pathname)).toBe(false);
  });
});
