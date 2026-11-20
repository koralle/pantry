import { Input as AriaInput } from "react-aria-components";
import { styled } from "styled-system/jsx";
import type { HTMLStyledProps } from "styled-system/types";

const RawInput = styled(AriaInput, {
  base: {
    "@media (hover: hover) and (pointer: fine)": {
      "&:hover:not(:disabled):not(:focus)": {
        borderColor: "fg.muted",
      },
    },
    "&:focus": {
      borderColor: "accent.solid",
      boxShadow: "accentRing",
      outline: "none",
      "@media (forced-colors: active)": {
        outline: "2px solid Highlight",
        outlineOffset: "1px",
      },
    },
    '&[aria-invalid="true"]': {
      borderColor: "danger.solid",
    },
    _placeholder: {
      color: "fg.faint",
    },
    background: "bg.surface",
    borderColor: "border.control",
    borderRadius: "box",
    borderStyle: "solid",
    borderWidth: "thin",
    boxSizing: "border-box",
    color: "fg.default",
    font: "inherit",
    fontSize: "[max(1rem, 1em)]",
    minBlockSize: "touch",
    paddingBlock: "2",
    paddingInline: "3",
    transitionDuration: "hover",
    transitionProperty: "border-color, box-shadow",
    transitionTimingFunction: "out",
    width: "full",
  },
});

type StyledInputProps = HTMLStyledProps<typeof RawInput>;

export const StyledInput = ({ type = "text", ...props }: StyledInputProps) => (
  <RawInput type={type} {...props} />
);
