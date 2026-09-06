import { css, cx } from "styled-system/css";

import {
  dataTable,
  dataTableCell,
  dataTableHeadCell,
  dataTableWrap,
} from "../../../styles/data-table";
import { skeleton } from "../../../styles/feedback";
import { srOnly } from "../../../styles/sr-only";
import { surface } from "../../../styles/surface";
import type { ListLayout } from "../lib/list-layout-preference";
import { bookmarkCards } from "./bookmark-card-list";

const skeletonReset = css({ borderWidth: "none", padding: "0" });
const titleStack = css({
  display: "flex",
  flexDirection: "column",
  gap: "0.5",
  minInlineSize: "0",
});
const chipRow = css({
  display: "flex",
  flexWrap: "wrap",
  gap: "1",
  minInlineSize: "0",
});
const nameCell = css({
  minInlineSize: "0",
  width: "50%",
});
const tagsCell = css({
  minInlineSize: "0",
  width: "30%",
});
const dateCell = css({
  minInlineSize: "0",
  width: "20%",
});
const cardItem = css({
  blockSize: "full",
  display: "flex",
  minInlineSize: "0",
});
const skeletonCard = css({
  display: "flex",
  flex: "1",
  flexDirection: "column",
  gap: "1.5",
  inlineSize: "full",
  minBlockSize: "5.5rem",
  minInlineSize: "0",
  paddingBlock: "4",
  paddingInline: "4.5",
});
const cardChips = cx(chipRow, css({ marginBlockStart: "auto" }));
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
const barUrlWide = cx(
  skeleton,
  skeletonReset,
  css({ inlineSize: "min-12", minBlockSize: "3" })
);
const barUrlNarrow = cx(
  skeleton,
  skeletonReset,
  css({ inlineSize: "min-10", minBlockSize: "3" })
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
const barDate = cx(
  skeleton,
  skeletonReset,
  css({ inlineSize: "14", minBlockSize: "4" })
);
const nbsp = "\u00A0";

const tableRows = [
  {
    id: "a",
    tags: [
      { className: barTagWide, id: "a1" },
      { className: barTagNarrow, id: "a2" },
    ],
    titleClass: barTitleWide,
    urlClass: barUrlWide,
  },
  {
    id: "b",
    tags: [{ className: barTagMid, id: "b1" }],
    titleClass: barTitleMid,
    urlClass: barUrlNarrow,
  },
  {
    id: "c",
    tags: [
      { className: barTagNarrow, id: "c1" },
      { className: barTagMid, id: "c2" },
    ],
    titleClass: barTitleNarrow,
    urlClass: barUrlWide,
  },
  {
    id: "d",
    tags: [
      { className: barTagWide, id: "d1" },
      { className: barTagMid, id: "d2" },
    ],
    titleClass: barTitleWide,
    urlClass: barUrlNarrow,
  },
  {
    id: "e",
    tags: [{ className: barTagNarrow, id: "e1" }],
    titleClass: barTitleMid,
    urlClass: barUrlWide,
  },
] as const;

const cardRows = [
  {
    id: "a",
    tags: [
      { className: barTagWide, id: "a1" },
      { className: barTagNarrow, id: "a2" },
    ],
    titleClass: barTitleWide,
    urlClass: barUrlWide,
  },
  {
    id: "b",
    tags: [
      { className: barTagMid, id: "b1" },
      { className: barTagWide, id: "b2" },
    ],
    titleClass: barTitleMid,
    urlClass: barUrlNarrow,
  },
  {
    id: "c",
    tags: [{ className: barTagNarrow, id: "c1" }],
    titleClass: barTitleNarrow,
    urlClass: barUrlWide,
  },
  {
    id: "d",
    tags: [
      { className: barTagMid, id: "d1" },
      { className: barTagNarrow, id: "d2" },
    ],
    titleClass: barTitleWide,
    urlClass: barUrlNarrow,
  },
] as const;

export const ListLoading = ({ layout }: { readonly layout: ListLayout }) => {
  if (layout === "card") {
    return (
      <div aria-busy="true">
        <span className={srOnly}>一覧を読み込み中</span>
        <ul className={bookmarkCards} aria-hidden="true">
          {cardRows.map((row) => (
            <li key={row.id} className={cardItem}>
              <div className={cx(surface, skeletonCard)}>
                <div className={row.titleClass}>{nbsp}</div>
                <div className={row.urlClass}>{nbsp}</div>
                <div className={cardChips}>
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
    );
  }

  return (
    <div aria-busy="true">
      <span className={srOnly}>一覧を読み込み中</span>
      <div className={dataTableWrap}>
        <table className={dataTable} aria-hidden="true">
          <thead>
            <tr>
              <th
                scope="col"
                className={cx(dataTableCell, dataTableHeadCell, nameCell)}
              >
                タイトル
              </th>
              <th
                scope="col"
                className={cx(dataTableCell, dataTableHeadCell, tagsCell)}
              >
                タグ
              </th>
              <th
                scope="col"
                className={cx(dataTableCell, dataTableHeadCell, dateCell)}
              >
                最終更新
              </th>
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row) => (
              <tr key={row.id}>
                <td className={cx(dataTableCell, nameCell, titleStack)}>
                  <div className={row.titleClass}>{nbsp}</div>
                  <div className={row.urlClass}>{nbsp}</div>
                </td>
                <td className={cx(dataTableCell, tagsCell)}>
                  <div className={chipRow}>
                    {row.tags.map((tag) => (
                      <div key={tag.id} className={tag.className}>
                        {nbsp}
                      </div>
                    ))}
                  </div>
                </td>
                <td className={cx(dataTableCell, dateCell)}>
                  <div className={barDate}>{nbsp}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
