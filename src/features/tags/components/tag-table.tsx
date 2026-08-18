import { Link } from '@tanstack/react-router'
import { Pencil, Pin } from 'lucide-react'
import { use } from 'react'
import { css, cx } from 'styled-system/css'

import { StyledLink } from '../../../shared/components/styled-link'
import { UiEmpty } from '../../../shared/components/ui-empty'
import {
  dataTable,
  dataTableCell,
  dataTableHeadCell,
  dataTableRow,
  dataTableRowLink,
  dataTableWrap
} from '../../../styles/data-table'
import { srOnly } from '../../../styles/sr-only'
import { tagShelfSearch } from '../../navigation/lib/bookmark-search-builders'
import { sortTagsForNav } from '../lib/tag-shelf'
import type { ShelfTag } from '../lib/tag-shelf'

const tagTableCount = css({
  fontVariantNumeric: 'tabular-nums',
  color: 'fg.muted',
  width: '14%'
})

const nameCol = css({
  minInlineSize: '0',
  width: '48%'
})

const pinCol = css({
  width: '14%'
})

const actionsCell = css({
  borderBlockEndWidth: 'thin',
  borderBlockEndStyle: 'solid',
  borderBlockEndColor: 'border.default',
  minInlineSize: '0',
  padding: '0',
  position: 'relative',
  textAlign: 'start',
  verticalAlign: 'middle',
  width: '24%'
})

const nameCell = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  minInlineSize: '0',
  overflowWrap: 'anywhere'
})

const shelfDot = css({
  inlineSize: '2.5',
  blockSize: '2.5',
  borderRadius: 'full',
  background: 'border.default',
  flexShrink: '0'
})

const editLink = css({
  position: 'absolute',
  inset: '0',
  zIndex: '2',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '1',
  color: 'accent.solid',
  fontSize: 'xs',
  fontWeight: 'semibold',
  textDecoration: 'none',
  minBlockSize: 'touch',
  minInlineSize: 'touch',
  boxSizing: 'border-box',
  _focusVisible: {
    outlineWidth: 'medium',
    outlineStyle: 'solid',
    outlineColor: 'accent.solid',
    outlineOffset: '-2px'
  },
  '@media (any-hover: hover)': {
    '&:hover': {
      textDecoration: 'underline',
      textUnderlineOffset: '3px'
    }
  },
  sm: {
    justifyContent: 'flex-start',
    paddingInline: '3'
  }
})

const editLabel = css({
  display: 'none',
  sm: {
    display: 'inline'
  }
})

export function TagTable({ tagPromise }: { readonly tagPromise: Promise<ShelfTag[]> }) {
  const tags = sortTagsForNav(use(tagPromise))

  if (tags.length === 0) {
    return (
      <UiEmpty
        title='まだタグがありません'
        action={
          <StyledLink
            to='/tags/new'
            visual='accent'>
            タグを作成
          </StyledLink>
        }
      />
    )
  }

  return (
    <div className={dataTableWrap}>
      <table className={dataTable}>
        <caption className={srOnly}>タグ</caption>
        <thead>
          <tr>
            <th
              scope='col'
              className={cx(dataTableCell, dataTableHeadCell, nameCol)}>
              名前
            </th>
            <th
              scope='col'
              className={cx(dataTableCell, dataTableHeadCell, tagTableCount)}>
              件数
            </th>
            <th
              scope='col'
              className={cx(dataTableCell, dataTableHeadCell, pinCol)}>
              ピン
            </th>
            <th
              scope='col'
              className={cx(dataTableHeadCell, actionsCell)}>
              <span className={srOnly}>操作</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {tags.map((tag) => (
            <tr
              key={tag.id}
              className={dataTableRow}>
              <td className={cx(dataTableCell, nameCol)}>
                <div className={nameCell}>
                  <span
                    className={shelfDot}
                    style={tag.color != null ? { backgroundColor: tag.color } : undefined}
                    aria-hidden='true'
                  />
                  <Link
                    to='/'
                    search={tagShelfSearch(tag.name)}
                    aria-label={tag.name}
                    className={dataTableRowLink}>
                    {tag.name}
                  </Link>
                </div>
              </td>
              <td className={cx(dataTableCell, tagTableCount)}>{tag.bookmarkCount}</td>
              <td className={cx(dataTableCell, pinCol)}>
                {tag.pinned ? (
                  <span>
                    <Pin
                      size={16}
                      aria-hidden
                    />
                    <span className={srOnly}>ピン留め中</span>
                  </span>
                ) : (
                  <span className={srOnly}>ピンなし</span>
                )}
              </td>
              <td className={actionsCell}>
                <Link
                  to='/tags/$id/edit'
                  params={{ id: String(tag.id) }}
                  aria-label={`${tag.name}を編集`}
                  className={editLink}>
                  <Pencil
                    size={16}
                    aria-hidden
                  />
                  <span className={editLabel}>編集</span>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
