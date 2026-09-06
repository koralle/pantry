import { css, cx } from "styled-system/css";

import { dialogActions } from "../../../styles/dialog";
import { skeleton } from "../../../styles/feedback";
import { srOnly } from "../../../styles/sr-only";
import { workbenchNav } from "../../../styles/workbench";

const detailLayout = css({
  display: "flex",
  flexDirection: "column",
  gap: "6",
  maxInlineSize: "42rem",
});
const detailHeader = css({
  display: "flex",
  flexDirection: "column",
  gap: "3",
  paddingBlockEnd: "1",
  paddingBlockStart: "2",
});

const skeletonReset = css({ borderWidth: "none", padding: "0" });
const skeletonBlockNote = cx(
  skeleton,
  skeletonReset,
  css({ minBlockSize: "5.5rem" })
);
const skeletonBlockDates = cx(
  skeleton,
  skeletonReset,
  css({ minBlockSize: "4.5rem" })
);
const skeletonLineNav = cx(
  skeleton,
  skeletonReset,
  css({ inlineSize: "22", minBlockSize: "4" })
);
const skeletonLineTitle = cx(
  skeleton,
  skeletonReset,
  css({ inlineSize: "min-22", minBlockSize: "8" })
);
const skeletonLineUrl = cx(
  skeleton,
  skeletonReset,
  css({ inlineSize: "min-18", minBlockSize: "4" })
);
const skeletonLineTags = cx(
  skeleton,
  skeletonReset,
  css({ inlineSize: "min-12", minBlockSize: "7" })
);
const skeletonLineAction = cx(
  skeleton,
  skeletonReset,
  css({ inlineSize: "22", minBlockSize: "11" })
);

export const BookmarkDetailSkeleton = () => (
  <div className={detailLayout} aria-busy="true">
    <span className={srOnly}>詳細を読み込み中</span>
    <div className={workbenchNav}>
      <div className={skeletonLineNav} aria-hidden="true" />
    </div>
    <header className={detailHeader}>
      <div className={skeletonLineTitle} aria-hidden="true" />
      <div className={skeletonLineUrl} aria-hidden="true" />
    </header>
    <div className={skeletonBlockNote} aria-hidden="true" />
    <div className={skeletonLineTags} aria-hidden="true" />
    <div className={skeletonBlockDates} aria-hidden="true" />
    <div className={dialogActions}>
      <div className={skeletonLineAction} aria-hidden="true" />
      <div className={skeletonLineAction} aria-hidden="true" />
    </div>
  </div>
);
