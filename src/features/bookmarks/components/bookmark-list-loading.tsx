import { css, cx } from 'styled-system/css'

import {
  dataTable,
  dataTableCell,
  dataTableHeadCell,
  dataTableWrap
} from '../../../styles/data-table'
import { skeleton } from '../../../styles/feedback'
import { srOnly } from '../../../styles/sr-only'
import { surface } from '../../../styles/surface'
import type { ListLayout } from '../lib/list-layout-preference'
import { bookmarkCards } from './bookmark-card-list'

const skeletonReset = css({ padding: '0', borderWidth: 'none' })
const titleStack = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5',
  minInlineSize: '0'
})
const chipRow = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '1',
  minInlineSize: '0'
})
const nameCell = css({
  minInlineSize: '0',
  width: '50%'
})
const tagsCell = css({
  minInlineSize: '0',
  width: '30%'
})
const dateCell = css({
  minInlineSize: '0',
  width: '20%'
})
const cardItem = css({
  display: 'flex',
  minInlineSize: '0',
  blockSize: 'full'
})
const skeletonCard = css({
  display: 'flex',
  flexDirection: 'column',
  flex: '1',
  gap: '1.5',
  minBlockSize: '5.5rem',
  minInlineSize: '0',
  inlineSize: 'full',
  paddingBlock: '4',
  paddingInline: '4.5'
})
const cardChips = cx(chipRow, css({ marginBlockStart: 'auto' }))
const barTitleWide = cx(skeleton, skeletonReset, css({ minBlockSize: '4', inlineSize: 'min-18' }))
const barTitleMid = cx(skeleton, skeletonReset, css({ minBlockSize: '4', inlineSize: 'min-12' }))
const barTitleNarrow = cx(skeleton, skeletonReset, css({ minBlockSize: '4', inlineSize: 'min-10' }))
const barUrlWide = cx(skeleton, skeletonReset, css({ minBlockSize: '3', inlineSize: 'min-12' }))
const barUrlNarrow = cx(skeleton, skeletonReset, css({ minBlockSize: '3', inlineSize: 'min-10' }))
const barTagWide = cx(skeleton, skeletonReset, css({ minBlockSize: '6', inlineSize: '16' }))
const barTagMid = cx(skeleton, skeletonReset, css({ minBlockSize: '6', inlineSize: '12' }))
const barTagNarrow = cx(skeleton, skeletonReset, css({ minBlockSize: '6', inlineSize: '8' }))
const barDate = cx(skeleton, skeletonReset, css({ minBlockSize: '4', inlineSize: '14' }))
const nbsp = '\u00a0'

const tableRows = [
  {
    id: 'a',
    titleClass: barTitleWide,
    urlClass: barUrlWide,
    tags: [
      { id: 'a1', className: barTagWide },
      { id: 'a2', className: barTagNarrow }
    ]
  },
  {
    id: 'b',
    titleClass: barTitleMid,
    urlClass: barUrlNarrow,
    tags: [{ id: 'b1', className: barTagMid }]
  },
  {
    id: 'c',
    titleClass: barTitleNarrow,
    urlClass: barUrlWide,
    tags: [
      { id: 'c1', className: barTagNarrow },
      { id: 'c2', className: barTagMid }
    ]
  },
  {
    id: 'd',
    titleClass: barTitleWide,
    urlClass: barUrlNarrow,
    tags: [
      { id: 'd1', className: barTagWide },
      { id: 'd2', className: barTagMid }
    ]
  },
  {
    id: 'e',
    titleClass: barTitleMid,
    urlClass: barUrlWide,
    tags: [{ id: 'e1', className: barTagNarrow }]
  }
] as const

const cardRows = [
  {
    id: 'a',
    titleClass: barTitleWide,
    urlClass: barUrlWide,
    tags: [
      { id: 'a1', className: barTagWide },
      { id: 'a2', className: barTagNarrow }
    ]
  },
  {
    id: 'b',
    titleClass: barTitleMid,
    urlClass: barUrlNarrow,
    tags: [
      { id: 'b1', className: barTagMid },
      { id: 'b2', className: barTagWide }
    ]
  },
  {
    id: 'c',
    titleClass: barTitleNarrow,
    urlClass: barUrlWide,
    tags: [{ id: 'c1', className: barTagNarrow }]
  },
  {
    id: 'd',
    titleClass: barTitleWide,
    urlClass: barUrlNarrow,
    tags: [
      { id: 'd1', className: barTagMid },
      { id: 'd2', className: barTagNarrow }
    ]
  }
] as const

export function ListLoading({ layout }: { readonly layout: ListLayout }) {
  if (layout === 'card') {
    return (
      <div aria-busy='true'>
        <span className={srOnly}>一覧を読み込み中</span>
        <ul
          className={bookmarkCards}
          aria-hidden='true'>
          {cardRows.map((row) => (
            <li
              key={row.id}
              className={cardItem}>
              <div className={cx(surface, skeletonCard)}>
                <div className={row.titleClass}>{nbsp}</div>
                <div className={row.urlClass}>{nbsp}</div>
                <div className={cardChips}>
                  {row.tags.map((tag) => (
                    <div
                      key={tag.id}
                      className={tag.className}>
                      {nbsp}
                    </div>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div aria-busy='true'>
      <span className={srOnly}>一覧を読み込み中</span>
      <div className={dataTableWrap}>
        <table
          className={dataTable}
          aria-hidden='true'>
          <thead>
            <tr>
              <th
                scope='col'
                className={cx(dataTableCell, dataTableHeadCell, nameCell)}>
                タイトル
              </th>
              <th
                scope='col'
                className={cx(dataTableCell, dataTableHeadCell, tagsCell)}>
                タグ
              </th>
              <th
                scope='col'
                className={cx(dataTableCell, dataTableHeadCell, dateCell)}>
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
                      <div
                        key={tag.id}
                        className={tag.className}>
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
  )
}
