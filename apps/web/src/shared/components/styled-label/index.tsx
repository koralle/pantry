import { styled } from "styled-system/jsx";
import type { HTMLStyledProps } from "styled-system/types";

const RawLabel = styled("label", {
  base: {
    alignContent: "center",
    color: "fg.default",
    display: "inline-flex",
    fontSize: "xs",
    fontWeight: "semibold",
    gap: "0.25rem",
  },
});

type StyledLabelProps = HTMLStyledProps<typeof RawLabel>;

export const StyledLabel = (props: StyledLabelProps) => <RawLabel {...props} />;
