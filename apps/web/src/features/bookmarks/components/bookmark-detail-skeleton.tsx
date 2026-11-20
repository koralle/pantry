import { css } from "styled-system/css";
import { visuallyHidden } from "styled-system/patterns";

import {
  detailCard,
  detailPage,
  detailWrap,
} from "../../../shared/styles/detail";
import { skeletonBar } from "../../../shared/styles/feedback";

const skeletonHead = css({
  alignItems: "center",
  columnGap: "3",
  display: "flex",
});

const skeletonIcon = css({
  blockSize: "8",
  borderRadius: "box",
  flexShrink: "0",
  inlineSize: "8",
});

const skeletonDomainBar = css({
  blockSize: "3.5",
  inlineSize: "32",
});

const skeletonTitleBar1 = css({
  blockSize: "5",
  inlineSize: "85%",
  marginBlockStart: "4",
});

const skeletonTitleBar2 = css({
  blockSize: "5",
  inlineSize: "55%",
  marginBlockStart: "2",
});

const skeletonUrlBar = css({
  blockSize: "9",
  inlineSize: "100%",
  marginBlockStart: "4",
});

const skeletonTagsRow = css({
  columnGap: "2",
  display: "flex",
  marginBlockStart: "4",
});

const skeletonTagPill = css({
  blockSize: "6",
  borderRadius: "full",
  inlineSize: "16",
});

export const BookmarkDetailSkeleton = () => (
  <div aria-busy="true" className={detailPage}>
    <output className={visuallyHidden()}>ブックマークを読み込み中…</output>
    <div aria-hidden className={detailWrap}>
      <div className={detailCard}>
        <div className={skeletonHead}>
          <span className={`${skeletonBar} ${skeletonIcon}`} />
          <span className={`${skeletonBar} ${skeletonDomainBar}`} />
        </div>
        <div className={`${skeletonBar} ${skeletonTitleBar1}`} />
        <div className={`${skeletonBar} ${skeletonTitleBar2}`} />
        <div className={`${skeletonBar} ${skeletonUrlBar}`} />
        <div className={skeletonTagsRow}>
          <span className={`${skeletonBar} ${skeletonTagPill}`} />
          <span className={`${skeletonBar} ${skeletonTagPill}`} />
        </div>
      </div>
    </div>
  </div>
);
