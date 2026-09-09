import { css, cx } from "styled-system/css";
import { flex, grid } from "styled-system/patterns";

import { skeleton } from "../../../styles/feedback";
import { srOnly } from "../../../styles/sr-only";

const listWrap = css({
  containerType: "inline-size",
});
const item = grid({
  borderColor: "border.default",
  borderRadius: "box",
  borderStyle: "solid",
  borderWidth: "thin",
  gap: 2,
  padding: "clamp(8px, 5.3333px + 0.6667cqi, 16px)",
});
const skeletonReset = css({ borderWidth: "none", padding: "0" });
const barTitleWide = cx(
  skeleton,
  skeletonReset,
  css({ inlineSize: "min-18", minBlockSize: "4" })
);
const barTitleMid = cx(
  skeleton,
  skeletonReset,
  css({ inlineSize: "min-12", minBlockSize: "4" })
);
const barTitleNarrow = cx(
  skeleton,
  skeletonReset,
  css({ inlineSize: "min-10", minBlockSize: "4" })
);
const barDate = cx(
  skeleton,
  skeletonReset,
  css({ inlineSize: "14", minBlockSize: "4" })
);
const barTagWide = cx(
  skeleton,
  skeletonReset,
  css({ inlineSize: "16", minBlockSize: "6" })
);
const barTagMid = cx(
  skeleton,
  skeletonReset,
  css({ inlineSize: "12", minBlockSize: "6" })
);
const barTagNarrow = cx(
  skeleton,
  skeletonReset,
  css({ inlineSize: "8", minBlockSize: "6" })
);
const nbsp = "\u00A0";

const rows = [
  {
    id: "a",
    tags: [
      { className: barTagWide, id: "a1" },
      { className: barTagNarrow, id: "a2" },
    ],
    titleClass: barTitleWide,
  },
  {
    id: "b",
    tags: [{ className: barTagMid, id: "b1" }],
    titleClass: barTitleMid,
  },
  {
    id: "c",
    tags: [
      { className: barTagNarrow, id: "c1" },
      { className: barTagMid, id: "c2" },
    ],
    titleClass: barTitleNarrow,
  },
  {
    id: "d",
    tags: [
      { className: barTagWide, id: "d1" },
      { className: barTagMid, id: "d2" },
    ],
    titleClass: barTitleWide,
  },
  {
    id: "e",
    tags: [{ className: barTagNarrow, id: "e1" }],
    titleClass: barTitleMid,
  },
] as const;

export const ListLoading = () => (
  <div aria-busy="true">
    <span className={srOnly}>一覧を読み込み中</span>
    <div className={listWrap}>
      <ul className={grid({ gap: 4 })} aria-hidden="true">
        {rows.map((row) => (
          <li key={row.id}>
            <div className={item}>
              <div className={row.titleClass}>{nbsp}</div>
              <div className={barDate}>{nbsp}</div>
              <div className={flex({ gap: 2, flexWrap: "wrap" })}>
                {row.tags.map((tag) => (
                  <div key={tag.id} className={tag.className}>
                    {nbsp}
                  </div>
                ))}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  </div>
);
