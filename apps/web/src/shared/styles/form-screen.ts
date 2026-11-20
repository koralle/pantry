import { css, cva } from "styled-system/css";

/** フォームを中央の狭いカラムに置くラッパー。 */
export const formWrap = css({
  display: "flex",
  flex: "1",
  justifyContent: "center",
  minBlockSize: "0",
  overscrollBehavior: "contain",
  overflowY: "auto",
  paddingBlock: { base: "5", md: "8" },
  paddingInline: { base: "3.5", md: "5" },
});

export const formCard = cva({
  base: {
    alignSelf: "flex-start",
    background: "bg.surface",
    borderColor: "border.default",
    borderRadius: "[1rem]",
    borderStyle: "solid",
    borderWidth: "thin",
    boxShadow: "card",
    display: "flex",
    flexDirection: "column",
    inlineSize: "100%",
    maxInlineSize: "[36rem]",
    padding: { base: "5", md: "7" },
    rowGap: "4",
  },
  defaultVariants: {
    busy: false,
  },
  variants: {
    busy: {
      false: {},
      true: {
        opacity: "0.75",
      },
    },
  },
});

export const formHeading = css({
  color: "fg.default",
  fontSize: "lg",
  fontWeight: "bold",
  letterSpacing: "tight",
  margin: "0",
});

export const formFieldset = css({
  borderWidth: "none",
  display: "flex",
  flexDirection: "column",
  margin: "0",
  minInlineSize: "0",
  padding: "0",
  rowGap: "4",
});

export const fieldGroup = css({
  display: "flex",
  flexDirection: "column",
  rowGap: "1.5",
});

export const flabel = css({
  color: "fg.default",
  fontSize: "xs",
  fontWeight: "semibold",
  letterSpacing: "0",
});

export const flabelReq = css({
  color: "danger.solid",
  marginInlineStart: "0.5",
});

/** アイコン入りの枠付き入力ボックス。input は枠なしで内側に置く。 */
export const inputBox = cva({
  base: {
    "@media (hover: hover) and (pointer: fine)": {
      "&:hover:not(:focus-within)": {
        borderColor: "fg.faint",
      },
    },
    _focusWithin: {
      borderColor: "accent.solid",
      boxShadow: "accentRing",
    },
    alignItems: "center",
    background: "bg.surface",
    borderColor: "border.control",
    borderRadius: "box",
    borderStyle: "solid",
    borderWidth: "thin",
    columnGap: "2",
    display: "flex",
    minBlockSize: "touch",
    paddingBlock: "2",
    paddingInline: "3",
    transitionDuration: "hover",
    transitionProperty: "border-color, box-shadow",
  },
  defaultVariants: {
    invalid: false,
  },
  variants: {
    invalid: {
      false: {},
      true: {
        borderColor: "danger.solid",
      },
    },
  },
});

export const inputBoxField = css({
  _placeholder: {
    color: "fg.faint",
  },
  background: "transparent",
  borderWidth: "none",
  color: "fg.default",
  flex: "1",
  fontFamily: "inherit",
  fontSize: "[max(1rem, 0.875rem)]",
  md: {
    fontSize: "sm",
  },
  minInlineSize: "0",
  outline: "none",
  padding: "0",
});

export const inputBoxIcon = css({
  color: "fg.faint",
  display: "inline-flex",
  flexShrink: "0",
});

export const inputRow = css({
  columnGap: "2",
  display: "flex",
  "& > :first-child": {
    flex: "1",
    minInlineSize: "0",
  },
});

export const noteBox = css({
  alignItems: "stretch",
  minBlockSize: "[4rem]",
});

export const noteArea = css({
  _placeholder: {
    color: "fg.faint",
  },
  background: "transparent",
  borderWidth: "none",
  color: "fg.default",
  flex: "1",
  fontFamily: "inherit",
  fontSize: "[max(1rem, 0.875rem)]",
  lineHeight: "relaxed",
  md: {
    fontSize: "sm",
  },
  minInlineSize: "0",
  outline: "none",
  padding: "0",
  resize: "vertical",
});

export const fieldErr = css({
  alignItems: "center",
  color: "danger.solid",
  columnGap: "1.5",
  display: "flex",
  fontSize: "2xs",
  margin: "0",
});

/** タグチップと入力を一つの枠にまとめたボックス。 */
export const tagInputBox = cva({
  base: {
    "@media (hover: hover) and (pointer: fine)": {
      "&:hover:not(:focus-within)": {
        borderColor: "fg.faint",
      },
    },
    _focusWithin: {
      borderColor: "accent.solid",
      boxShadow: "accentRing",
    },
    alignItems: "center",
    background: "bg.surface",
    borderColor: "border.control",
    borderRadius: "box",
    borderStyle: "solid",
    borderWidth: "thin",
    columnGap: "1.5",
    display: "flex",
    flexWrap: "wrap",
    minBlockSize: "touch",
    paddingBlock: "1.5",
    paddingInline: "2.5",
    rowGap: "1.5",
    transitionDuration: "hover",
    transitionProperty: "border-color, box-shadow",
  },
  defaultVariants: {
    invalid: false,
  },
  variants: {
    invalid: {
      false: {},
      true: {
        borderColor: "danger.solid",
      },
    },
  },
});

export const tagInputField = css({
  _placeholder: {
    color: "fg.faint",
  },
  background: "transparent",
  borderWidth: "none",
  color: "fg.default",
  flex: "1",
  fontFamily: "inherit",
  fontSize: "xs",
  minInlineSize: "[5rem]",
  outline: "none",
  paddingBlock: "0.5",
  paddingInline: "0.5",
});

export const tchip = css({
  alignItems: "center",
  background: "surface.muted",
  borderColor: "border.default",
  borderRadius: "full",
  borderStyle: "solid",
  borderWidth: "thin",
  color: "fg.default",
  columnGap: "1.5",
  display: "inline-flex",
  fontSize: "2xs",
  fontWeight: "semibold",
  maxInlineSize: "100%",
  paddingBlock: "0.5",
  paddingInlineEnd: "1",
  paddingInlineStart: "2.5",
});

export const tchipName = css({
  minInlineSize: "0",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

export const tchipRemove = css({
  "@media (hover: hover) and (pointer: fine)": {
    "&:hover:not(:disabled)": {
      color: "fg.default",
    },
  },
  _after: {
    content: '""',
    inset: "-8px",
    position: "absolute",
  },
  alignItems: "center",
  background: "transparent",
  borderRadius: "full",
  borderWidth: "none",
  color: "fg.muted",
  cursor: "pointer",
  display: "inline-flex",
  flexShrink: "0",
  justifyContent: "center",
  padding: "0",
  position: "relative",
  blockSize: "[0.9375rem]",
  inlineSize: "[0.9375rem]",
});

export const formFoot = css({
  columnGap: "[0.5625rem]",
  display: "flex",
  flexDirection: "column",
  marginBlockStart: "1",
  rowGap: "2.5",
  md: {
    flexDirection: "row",
  },
  "& > *": {
    inlineSize: "100%",
    md: {
      inlineSize: "auto",
    },
  },
});

export const formFootSpacer = css({
  display: "none",
  md: {
    display: "block",
    flex: "1",
  },
});
