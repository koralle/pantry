import { Pencil, Pin } from 'lucide-react'
import { use } from 'react'
import { css } from 'styled-system/css'

import { StyledLink } from '../../../shared/components/styled-link'
import { UiEmpty } from '../../../shared/components/ui-empty'
import { srOnly } from '../../../styles/sr-only'
import { tagShelfSearch } from '../../navigation/lib/bookmark-search-builders'
import { sortTagsForNav } from '../lib/tag-shelf'
import type { ShelfTag } from '../lib/tag-shelf'

export const tagTable = css({
  width: 'full',
  borderCollapse: 'collapse'
})

export const tagTableCell = css({
  borderBlockEndWidth: 'thin',
  borderBlockEndStyle: 'solid',
  borderBlockEndColor: 'border.default',
  paddingBlock: '3',
  paddingInline: '2',
  textAlign: 'start',
  verticalAlign: 'middle'
})

export const tagTableHeader = css({
  color: 'fg.muted',
  fontSize: 'xs2',
  fontWeight: 'semibold'
})

const tagTableCount = css({
  fontVariantNumeric: 'tabular-nums',
  color: 'fg.muted'
})

const tagTableMuted = css({
  color: 'fg.muted'
})

const shelfDot = css({
  inlineSize: '2.5',
  blockSize: '2.5',
  borderRadius: 'full',
  background: 'border.default',
  flexShrink: '0'
})

export function TagTable({ tagPromise }: { readonly tagPromise: Promise<ShelfTag[]> }) {
  const tags = sortTagsForNav(use(tagPromise))

  if (tags.length === 0) {
    return (
      <UiEmpty
        title='まだ箱がありません'
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
    <table className={tagTable}>
      <thead>
        <tr>
          <th
            scope='col'
            className={`${tagTableCell} ${tagTableHeader}`}>
            色
          </th>
          <th
            scope='col'
            className={`${tagTableCell} ${tagTableHeader}`}>
            名前
          </th>
          <th
            scope='col'
            className={`${tagTableCell} ${tagTableHeader}`}>
            件数
          </th>
          <th
            scope='col'
            className={`${tagTableCell} ${tagTableHeader}`}>
            ピン
          </th>
          <th
            scope='col'
            className={`${tagTableCell} ${tagTableHeader}`}>
            <span className={srOnly}>操作</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {tags.map((tag) => (
          <tr key={tag.id}>
            <td className={tagTableCell}>
              <span
                className={shelfDot}
                style={tag.color != null ? { backgroundColor: tag.color } : undefined}
                aria-hidden='true'
              />
              <span className={srOnly}>{tag.color ?? '色なし'}</span>
            </td>
            <td className={tagTableCell}>
              <StyledLink
                to='/'
                search={tagShelfSearch(tag.name)}
                visual='plain'
                fontWeight='semibold'>
                {tag.name}
              </StyledLink>
            </td>
            <td className={`${tagTableCell} ${tagTableCount}`}>{tag.bookmarkCount}</td>
            <td className={tagTableCell}>
              {tag.pinned ? (
                <span>
                  <Pin
                    size={16}
                    aria-hidden
                  />
                  <span className={srOnly}>ピン留め中</span>
                </span>
              ) : (
                <span className={tagTableMuted}>—</span>
              )}
            </td>
            <td className={tagTableCell}>
              <StyledLink
                to='/tags/$id/edit'
                params={{ id: String(tag.id) }}
                visual='accent'>
                <Pencil
                  size={16}
                  aria-hidden
                />{' '}
                編集
              </StyledLink>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
