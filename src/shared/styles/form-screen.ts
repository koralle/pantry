import { css, cva } from "styled-system/css";

/** シェル無し画面の全高コンテナ（トップバー + スクロール本体）。 */
export const workbenchScreen = css({
  background: "bg.canvas",
  display: "flex",
  flexDirection: "column",
  minBlockSize: "dvh",
});

/** フォームを中央の狭いカラムに置くラッパー。 */
export const formWrap = css({
  display: "flex",
  flex: "1",
  justifyContent: "center",
  minBlockSize: "0",
  overflowY: "auto",
  paddingBlock: "7",
  paddingInline: "5",
});

export const formCard = cva({
  base: {
    alignSelf: "flex-start",
    display: "flex",
    flexDirection: "column",
    inlineSize: "100%",
    maxInlineSize: "[30rem]",
    rowGap: "3.5",
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
  fontSize: "[1.0625rem]",
  fontWeight: "bold",
  letterSpacing: "tight",
});

export const formFieldset = css({
  borderWidth: "none",
  display: "flex",
  flexDirection: "column",
  margin: "0",
  minInlineSize: "0",
  padding: "0",
  rowGap: "3.5",
});

export const fieldGroup = css({
  display: "flex",
  flexDirection: "column",
  rowGap: "1.5",
});

export const flabel = css({
  color: "fg.muted",
  fontSize: "2xs",
  fontWeight: "bold",
  letterSpacing: "[0.02em]",
});

/** アイコン入りの枠付き入力ボックス。input は枠なしで内側に置く。 */
export const inputBox = cva({
  base: {
    _focusWithin: {
      borderColor: "accent.solid",
      boxShadow: "[0_0_0_3px_{colors.accent.subtle}]",
    },
    alignItems: "center",
    background: "bg.surface",
    borderColor: "border.default",
    borderRadius: "[0.5625rem]",
    borderStyle: "solid",
    borderWidth: "thin",
    columnGap: "2",
    display: "flex",
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
  fontSize: "sm",
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
  fontSize: "sm",
  lineHeight: "relaxed",
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
    _focusWithin: {
      borderColor: "accent.solid",
      boxShadow: "[0_0_0_3px_{colors.accent.subtle}]",
    },
    alignItems: "center",
    background: "bg.surface",
    borderColor: "border.default",
    borderRadius: "[0.5625rem]",
    borderStyle: "solid",
    borderWidth: "thin",
    columnGap: "1.5",
    display: "flex",
    flexWrap: "wrap",
    minBlockSize: "[2.5rem]",
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
  "@media (any-hover: hover)": {
    "&:hover:not(:disabled)": {
      color: "fg.default",
    },
  },
  alignItems: "center",
  background: "transparent",
  borderRadius: "full",
  borderWidth: "none",
  color: "fg.faint",
  cursor: "pointer",
  display: "inline-flex",
  flexShrink: "0",
  justifyContent: "center",
  padding: "0",
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
