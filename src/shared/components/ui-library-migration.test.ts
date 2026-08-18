import {
  Autocomplete,
  Button,
  Dialog,
  DialogTrigger,
  Heading,
  Input,
  ListBox,
  Modal,
  ModalOverlay,
  NumberField,
  RadioGroup,
  SearchField,
  Select,
  useFilter
} from 'react-aria-components'
import { describe, expect, test } from 'vitest'

describe('react-aria-components', () => {
  test('exports the primitives used by the app', () => {
    expect(Button).toBeTypeOf('object')
    expect(Input).toBeTypeOf('object')
    expect(Select).toBeTypeOf('object')
    expect(Autocomplete).toBeTypeOf('function')
    expect(useFilter).toBeTypeOf('function')
    expect(ListBox).toBeTypeOf('object')
    expect(SearchField).toBeTypeOf('object')
    expect(NumberField).toBeTypeOf('object')
    expect(RadioGroup).toBeTypeOf('object')
    expect(DialogTrigger).toBeTypeOf('function')
    expect(ModalOverlay).toBeTypeOf('object')
    expect(Modal).toBeTypeOf('object')
    expect(Dialog).toBeTypeOf('object')
    expect(Heading).toBeTypeOf('object')
  })
})
