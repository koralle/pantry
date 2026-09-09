import type { ReactNode } from "react";
import { css } from "styled-system/css";

const skipLink = css({
  "&:not(:focus)": {
    borderWidth: "0",
    clip: "rect(0, 0, 0, 0)",
    height: "1px",
    margin: "-1px",
    overflow: "hidden",
    padding: "0",
    whiteSpace: "nowrap",
    width: "1px",
  },
  background: "bg.surface",
  borderColor: "accent.solid",
  borderRadius: "box",
  borderStyle: "solid",
  borderWidth: "thin",
  color: "fg.default",
  insetBlockStart: "4",
  insetInlineStart: "4",
  paddingBlock: "2",
  paddingInline: "3",
  position: "absolute",
  textDecoration: "none",
  zIndex: "10",
});

const shell = css({
  blockSize: "100dvh",
  display: "grid",
  gridTemplateColumns: "1fr",
  gridTemplateRows: "auto minmax(0, 1fr)",
  md: {
    gridTemplateColumns: "16rem minmax(0, 1fr)",
  },
});

const shellHeader = css({
  gridColumn: "1 / -1",
});

const shellContent = css({
  display: "flex",
  flexDirection: "column",
  minBlockSize: "0",
  minInlineSize: "0",
});

const shellMain = css({
  flex: "1",
  md: {
    paddingBlockEnd: "10",
    paddingBlockStart: "6",
    paddingInline: "6",
  },
  minBlockSize: "0",
  overflow: "auto",
  paddingBlockEnd: "8",
  paddingBlockStart: "5",
  paddingInline: "4",
});

export const ProtectedShell = ({
  sidebar,
  header,
  children,
}: {
  readonly sidebar: ReactNode;
  readonly header: ReactNode;
  readonly children: ReactNode;
}) => (
  <div className={shell}>
    <a href="#content" className={skipLink}>
      本文へ
    </a>
    <div className={shellHeader}>{header}</div>
    {sidebar}
    <div className={shellContent}>
      <main
        id="content"
        data-scroll-restoration-id="content"
        tabIndex={-1}
        className={shellMain}
      >
        {children}
      </main>
    </div>
  </div>
);
