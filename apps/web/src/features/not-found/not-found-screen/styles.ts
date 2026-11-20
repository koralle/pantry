import { css } from "styled-system/css";

/** モックの `.center-state` — コンテンツ中央の状態表示（404・致命的エラー）。 */
export const stateCenter = css({
  alignItems: "center",
  display: "flex",
  flex: "1",
  flexDirection: "column",
  justifyContent: "center",
  paddingBlock: "10",
  paddingInline: "4",
  rowGap: "2",
  textAlign: "center",
});

/** モックの `.code404` — モノスペースのステータスコード。 */
export const stateCode = css({
  color: "accent.solid",
  fontFamily: "mono",
  fontSize: "xs2",
  fontWeight: "bold",
  letterSpacing: "[0.2em]",
  margin: "0",
});

/** モックの `.ic` — 囲みアイコン。`tone` で mute/danger を切り替える。 */
export const stateIcon = css({
  alignItems: "center",
  borderRadius: "sheet",
  display: "inline-flex",
  blockSize: "[3.25rem]",
  inlineSize: "[3.25rem]",
  justifyContent: "center",
  marginBlockEnd: "1.5",
});

export const stateIconMute = css({
  background: "bg.surface",
  borderColor: "border.default",
  borderStyle: "solid",
  borderWidth: "thin",
  boxShadow: "surface",
  color: "fg.muted",
});

export const stateIconDanger = css({
  background: "danger.surface",
  borderColor: "danger.border",
  borderStyle: "solid",
  borderWidth: "thin",
  boxShadow: "surface",
  color: "danger.solid",
});

export const stateTitle = css({
  color: "fg.default",
  fontSize: "md2",
  fontWeight: "bold",
  margin: "0",
  textWrap: "balance",
});

export const stateSub = css({
  color: "fg.muted",
  fontSize: "xs",
  lineHeight: "relaxed",
  margin: "0",
  maxInlineSize: "[22rem]",
  textWrap: "pretty",
});

export const stateActions = css({
  columnGap: "2.5",
  display: "flex",
  marginBlockStart: "3.5",
});

/** シェル無しの致命的エラーで全画面中央にする。 */
export const fatalScreen = css({
  display: "flex",
  flexDirection: "column",
  minBlockSize: "100svb",
});
