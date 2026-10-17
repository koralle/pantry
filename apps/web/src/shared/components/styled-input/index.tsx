import { Input as AriaInput } from "react-aria-components";
import { styled } from "styled-system/jsx";
import type { HTMLStyledProps } from "styled-system/types";

const RawInput = styled(AriaInput, {
  base: {
    background: "bg.surface",
    borderColor: "border.default",
    borderRadius: "box",
    borderStyle: "solid",
    borderWidth: "thin",
    boxSizing: "border-box",
    minBlockSize: "touch",
    paddingBlock: "2",
    paddingInline: "3",
    width: "full",
  },
});

type StyledInputProps = HTMLStyledProps<typeof RawInput>;

export const StyledInput = ({ type = "text", ...props }: StyledInputProps) => (
  <RawInput type={type} {...props} />
);
