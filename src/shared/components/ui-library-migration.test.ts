import {
  Button,
  Dialog,
  DialogTrigger,
  Heading,
  Input,
  Modal,
  ModalOverlay
} from 'react-aria-components'
import { describe, expect, test } from 'vitest'

describe('react-aria-components', () => {
  test('exports the primitives used by the app', () => {
    expect(Button).toBeTypeOf('object')
    expect(Input).toBeTypeOf('object')
    expect(DialogTrigger).toBeTypeOf('function')
    expect(ModalOverlay).toBeTypeOf('object')
    expect(Modal).toBeTypeOf('object')
    expect(Dialog).toBeTypeOf('object')
    expect(Heading).toBeTypeOf('object')
  })
})
