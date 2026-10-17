import { describe, expect, test } from "vitest";

import { isPasskeyUserCancelled } from "./error";

describe(isPasskeyUserCancelled, () => {
  test("treats Better Auth cancel codes as user cancellation", () => {
    expect(isPasskeyUserCancelled({ code: "AUTH_CANCELLED" })).toBeTruthy();
    expect(
      isPasskeyUserCancelled({ code: "REGISTRATION_CANCELLED" })
    ).toBeTruthy();
    expect(
      isPasskeyUserCancelled({ code: "ERROR_CEREMONY_ABORTED" })
    ).toBeTruthy();
  });

  test("does not treat other failures as cancellation", () => {
    expect(
      isPasskeyUserCancelled({ code: "AUTHENTICATION_FAILED" })
    ).toBeFalsy();
    expect(
      isPasskeyUserCancelled({ code: "PREVIOUSLY_REGISTERED" })
    ).toBeFalsy();
    expect(isPasskeyUserCancelled({ code: "SESSION_REQUIRED" })).toBeFalsy();
    expect(isPasskeyUserCancelled(null)).toBeFalsy();
    expect(isPasskeyUserCancelled()).toBeFalsy();
  });
});
