import { describe, expect, test } from "vitest";

import {
  isConditionalMediationAvailable,
  isWebAuthnAvailable,
} from "./webauthn-support";

function PublicKeyCredentialStub() {
  return;
}

const publicKeyCredentialWithCheck =
  PublicKeyCredentialStub as typeof PublicKeyCredentialStub & {
    isConditionalMediationAvailable?: () => Promise<boolean>;
  };

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

describe(isConditionalMediationAvailable, () => {
  test("is false when PublicKeyCredential is missing", async () => {
    await expect(isConditionalMediationAvailable({})).resolves.toBeFalsy();
  });

  test("is false when the browser does not expose the check", async () => {
    delete publicKeyCredentialWithCheck.isConditionalMediationAvailable;
    await expect(
      isConditionalMediationAvailable({
        PublicKeyCredential: PublicKeyCredentialStub,
      })
    ).resolves.toBeFalsy();
  });

  test("follows the browser report when the check exists", async () => {
    publicKeyCredentialWithCheck.isConditionalMediationAvailable = async () =>
      true;
    await expect(
      isConditionalMediationAvailable({
        PublicKeyCredential: PublicKeyCredentialStub,
      })
    ).resolves.toBeTruthy();

    publicKeyCredentialWithCheck.isConditionalMediationAvailable = async () =>
      false;
    await expect(
      isConditionalMediationAvailable({
        PublicKeyCredential: PublicKeyCredentialStub,
      })
    ).resolves.toBeFalsy();
  });
});
