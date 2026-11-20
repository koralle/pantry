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
  Popover,
  SearchField,
  Select,
  useFilter,
} from "react-aria-components";
import { describe, expect, test } from "vitest";

describe("react-aria-components", () => {
  test("form の部品を export する", () => {
    expect(Button).toBeTypeOf("object");
    expect(Input).toBeTypeOf("object");
    expect(Select).toBeTypeOf("object");
    expect(SearchField).toBeTypeOf("object");
    expect(NumberField).toBeTypeOf("object");
  });

  test("選択と overlay の部品を export する", () => {
    expect(ListBox).toBeTypeOf("object");
    expect(Autocomplete).toBeTypeOf("function");
    expect(RadioGroup).toBeTypeOf("object");
    expect(Popover).toBeTypeOf("object");
    expect(DialogTrigger).toBeTypeOf("function");
  });

  test("dialog と見出しの部品、filter の hook を export する", () => {
    expect(Dialog).toBeTypeOf("object");
    expect(Modal).toBeTypeOf("object");
    expect(ModalOverlay).toBeTypeOf("object");
    expect(Heading).toBeTypeOf("object");
    expect(useFilter).toBeTypeOf("function");
  });
});
