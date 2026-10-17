import { describe, expect, test } from "vitest";

import { isWebAuthnAvailable } from "./webauthn-support";

function PublicKeyCredentialStub() {
  return;
}

describe(isWebAuthnAvailable, () => {
  test("is true when PublicKeyCredential is a function", () => {
    expect(
      isWebAuthnAvailable({ PublicKeyCredential: PublicKeyCredentialStub })
    ).toBeTruthy();
  });

  test("is false when PublicKeyCredential is missing", () => {
    expect(isWebAuthnAvailable({})).toBeFalsy();
    expect(isWebAuthnAvailable({ PublicKeyCredential: undefined })).toBeFalsy();
  });
});
