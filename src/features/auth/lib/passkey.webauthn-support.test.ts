import { describe, expect, test } from 'vitest'

import { isConditionalMediationAvailable, isWebAuthnAvailable } from './passkey.webauthn-support'

function PublicKeyCredentialStub() {
  return undefined
}

const publicKeyCredentialWithCheck = PublicKeyCredentialStub as typeof PublicKeyCredentialStub & {
  isConditionalMediationAvailable?: () => Promise<boolean>
}

describe('isWebAuthnAvailable', () => {
  test('is true when PublicKeyCredential is a function', () => {
    expect(isWebAuthnAvailable({ PublicKeyCredential: PublicKeyCredentialStub })).toBe(true)
  })

  test('is false when PublicKeyCredential is missing', () => {
    expect(isWebAuthnAvailable({})).toBe(false)
    expect(isWebAuthnAvailable({ PublicKeyCredential: undefined })).toBe(false)
  })
})

describe('isConditionalMediationAvailable', () => {
  test('is false when PublicKeyCredential is missing', async () => {
    expect(await isConditionalMediationAvailable({})).toBe(false)
  })

  test('is false when the browser does not expose the check', async () => {
    delete publicKeyCredentialWithCheck.isConditionalMediationAvailable
    expect(
      await isConditionalMediationAvailable({ PublicKeyCredential: PublicKeyCredentialStub })
    ).toBe(false)
  })

  test('follows the browser report when the check exists', async () => {
    publicKeyCredentialWithCheck.isConditionalMediationAvailable = async () => true
    expect(
      await isConditionalMediationAvailable({ PublicKeyCredential: PublicKeyCredentialStub })
    ).toBe(true)

    publicKeyCredentialWithCheck.isConditionalMediationAvailable = async () => false
    expect(
      await isConditionalMediationAvailable({ PublicKeyCredential: PublicKeyCredentialStub })
    ).toBe(false)
  })
})
