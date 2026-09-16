import { defineGlobalStyles } from "@pandacss/dev";

export const globalCss = defineGlobalStyles({
  "*, ::before, ::after": {
    boxSizing: "border-box",
  },
  "::placeholder": {
    opacity: "unset",
  },
  ':disabled, [aria-disabled="true"]': {
    cursor: "default",
  },
  ":focus-visible": {
    outline: "2px solid",
    outlineColor: "accent.solid",
    outlineOffset: "2px",
  },
  ":root": {
    WebkitTapHighlightColor: "transparent",
    WebkitTextSizeAdjust: "100%",
    accentColor: "accent.solid",
    colorScheme: "light",
    fontFamily: "body",
    fontSizeAdjust: "from-font",
    lineBreak: "strict",
    lineHeight: "body",
    overflowWrap: "anywhere",
    scrollbarGutter: "stable",
    textAutospace: "normal",
    textSizeAdjust: "100%",
    textSpacingTrim: "trim-start",
  },
  "@media (prefers-reduced-motion: reduce)": {
    "*, *::before, *::after": {
      animation: "none !important",
      transition: "none !important",
    },
  },
  '[hidden]:not([hidden="until-found"])': {
    display: "none !important",
  },
  "[popover]": {
    margin: "unset",
  },
  '[tabindex="-1"]:focus': {
    outline: "none !important",
  },
  a: {
    color: "unset",
  },
  "a:any-link": {
    textDecorationInset: "auto",
    textDecorationLine: "unset",
    textDecorationThickness: "from-font",
  },
  "address:lang(ja)": {
    fontStyle: "unset",
  },
  "blockquote, figure": {
    marginInline: "unset",
  },
  body: {
    background: "bg.canvas",
    color: "fg.default",
    margin: 0,
    minBlockSize: "100dvb",
  },
  "button, input, select, textarea, ::file-selector-button": {
    borderColor: "unset",
    borderRadius: "unset",
    borderStyle: "solid",
    borderWidth: "1px",
    color: "unset",
    font: "unset",
    letterSpacing: "unset",
    textAlign: "unset",
  },
  'button, input:is([type="button"], [type="submit"], [type="reset"]), ::file-selector-button':
    {
      backgroundColor: "unset",
    },
  'button, input:is([type="button"], [type="submit"], [type="reset"]), [role="tab"], [role="button"], [role="option"], ::file-selector-button':
    {
      touchAction: "manipulation",
    },
  'button:enabled, label[for], select:enabled, input:is([type="button"], [type="submit"], [type="reset"], [type="radio"], [type="checkbox"]):enabled, [role="tab"], [role="button"], [role="option"], :enabled::file-selector-button':
    {
      cursor: "pointer",
    },
  "caption, th": {
    textAlign: "unset",
  },
  "code, kbd, samp": {
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    fontFeatureSettings: "initial",
    fontSize: "unset",
    fontVariantLigatures: "none",
    fontVariationSettings: "initial",
  },
  dd: {
    marginInlineStart: "unset",
  },
  dialog: {
    maxBlockSize: "unset",
    maxInlineSize: "unset",
  },
  "dialog, [popover]": {
    border: "unset",
    overscrollBehaviorBlock: "contain",
    padding: "unset",
  },
  "dialog::backdrop": {
    backgroundColor: "oklch(0% 0 0deg / 30%)",
  },
  "dialog:not([open], [popover]), [popover]:not(:popover-open)": {
    display: "none !important",
  },
  dt: {
    fontWeight: "bolder",
  },
  "em:lang(ja)": {
    fontWeight: "bolder",
  },
  fieldset: {
    border: "unset",
    marginInline: "unset",
    minInlineSize: 0,
    padding: "unset",
  },
  h1: {
    fontSize: "title",
    fontWeight: "bold",
    lineHeight: "tight",
    marginBlock: "unset",
    textWrap: "pretty",
  },
  "h2, h3, h4, h5, h6": {
    marginBlock: "unset",
  },
  "i:lang(ja), cite:lang(ja), dfn:lang(ja)": {
    fontStyle: "unset",
  },
  iframe: {
    border: "unset",
  },
  "img, svg, picture, video, audio, canvas, model, iframe, embed, object": {
    maxInlineSize: "100%",
    verticalAlign: "bottom",
  },
  "img, svg, picture, video, canvas, model, iframe, embed, object": {
    blockSize: "auto",
  },
  'input:is([type="radio"], [type="checkbox"])': {
    margin: "unset",
  },
  'input:not([type="button"], [type="submit"], [type="reset"]), textarea, [contenteditable]':
    {
      textAutospace: "no-autospace",
    },
  'input[type="file"]': {
    border: "unset",
  },
  'input[type="search"]': {
    WebkitAppearance: "textfield",
  },
  legend: {
    paddingInline: "unset",
  },
  "p, blockquote, figure, pre, address, ul, ol, dl, menu": {
    marginBlock: "unset",
  },
  "p:lang(en)": {
    textWrap: "pretty",
  },
  pre: {
    textAutospace: "no-autospace",
    textSpacingTrim: "space-all",
  },
  table: {
    borderCollapse: "collapse",
  },
  textarea: {
    marginBlock: "unset",
    resize: "block",
  },
  "ul, ol, menu": {
    listStyleType: '""',
    paddingInlineStart: "unset",
  },
});
