import { describe, expect, test } from 'vitest'

import { passkeyPluginOptions } from './passkey-plugin-options'

describe('passkeyPluginOptions', () => {
  test('derives rpID and origin from BETTER_AUTH_URL', () => {
    expect(passkeyPluginOptions('http://localhost:3000')).toEqual({
      rpID: 'localhost',
      rpName: 'Pantry',
      origin: 'http://localhost:3000'
    })
  })

  test('uses the hostname as rpID on a production origin', () => {
    expect(passkeyPluginOptions('https://pantry.example.com')).toEqual({
      rpID: 'pantry.example.com',
      rpName: 'Pantry',
      origin: 'https://pantry.example.com'
    })
  })

  test('does not include a trailing slash on origin', () => {
    expect(passkeyPluginOptions('https://pantry.example.com/').origin).toBe(
      'https://pantry.example.com'
    )
  })
})
