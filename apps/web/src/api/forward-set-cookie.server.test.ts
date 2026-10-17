import { describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({ responseHeaders: new Headers() }));

// 処理中リクエストのレスポンスヘッダーを差し替える。
vi.mock("@tanstack/react-start/server", () => ({
  getResponseHeaders: () => mocks.responseHeaders,
}));

import { forwardSetCookie } from "./forward-set-cookie.server";

const SESSION =
  "better-auth.session_token=valid; Max-Age=604800; Path=/; HttpOnly; SameSite=Lax";
const OTHER = "theme=dark; Path=/";

describe(forwardSetCookie, () => {
  test("Set-Cookie をレスポンスへ追加し、同じ値は重ねない", () => {
    mocks.responseHeaders = new Headers();

    forwardSetCookie([SESSION]);
    forwardSetCookie([SESSION, OTHER]);

    expect(mocks.responseHeaders.getSetCookie()).toStrictEqual([
      SESSION,
      OTHER,
    ]);
  });

  test("既にあるほかの Set-Cookie は残す", () => {
    mocks.responseHeaders = new Headers();
    mocks.responseHeaders.append("set-cookie", OTHER);

    forwardSetCookie([SESSION]);

    expect(mocks.responseHeaders.getSetCookie()).toStrictEqual([
      OTHER,
      SESSION,
    ]);
  });
});
