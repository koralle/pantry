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
  color: "fg.faint",
});

export const stateIconDanger = css({
  background: "danger.surface",
  color: "danger.solid",
});

export const stateTitle = css({
  fontSize: "md2",
  fontWeight: "bold",
  margin: "0",
});

export const stateSub = css({
  color: "fg.muted",
  fontSize: "xs",
  lineHeight: "body",
  margin: "0",
  maxInlineSize: "[19rem]",
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
