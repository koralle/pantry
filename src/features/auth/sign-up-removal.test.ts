import { describe, expect, test } from 'vitest'

import type { FileRouteTypes } from '../../routeTree.gen'

type SignUpRouteIsAbsent =
  Extract<FileRouteTypes['fullPaths'], '/sign-up'> extends never ? true : false

const signUpRouteIsAbsent: SignUpRouteIsAbsent = true

describe('sign-up removal', () => {
  test('does not register a sign-up route', () => {
    expect(signUpRouteIsAbsent).toBe(true)
  })
})
