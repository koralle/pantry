import { Link } from '@tanstack/react-router'
import { Package, Plus } from 'lucide-react'
import { css, cx } from 'styled-system/css'

import { StyledLink } from '../../../shared/components/styled-link'
import { UiEmpty } from '../../../shared/components/ui-empty'
import { surface } from '../../../styles/surface'
import { tagShelfSearch } from '../../navigation/lib/bookmark-search-builders'
import { touchTagLastUsed } from '../functions/touch-tag-last-used'
import { sortTagsForEntrance } from '../lib/tag-shelf'
import type { ShelfTag } from '../lib/tag-shelf'

export const entranceGrid = css({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '3',
  margin: '0',
  padding: '0',
  listStyle: 'none'
})

const entranceBox = cx(
  surface,
  css({
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5',
    minBlockSize: '5.5rem',
    textDecoration: 'none',
    color: 'fg.default',
    position: 'relative',
    overflow: 'hidden',
    paddingBlockStart: '5'
  })
)

const entranceBoxStripe = css({
  position: 'absolute',
  insetInline: '0',
  insetBlockStart: '0',
  blockSize: '4',
  background: 'border.default'
})

const entranceBoxName = css({
  fontWeight: 'bold',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
})

const entranceBoxCount = css({
  color: 'fg.muted',
  fontSize: 'xs',
  fontVariantNumeric: 'tabular-nums'
})

const entranceEmptyActions = css({
  display: 'flex',
  flexWrap: 'wrap',
  rowGap: '3',
  columnGap: '5',
  justifyContent: 'center'
})

export function EntranceBoxesIdeal({ tags }: { readonly tags: ShelfTag[] }) {
  const sorted = sortTagsForEntrance(tags)

  if (sorted.length === 0) {
    return (
      <UiEmpty
        title='まだ箱がありません'
        action={
          <div className={entranceEmptyActions}>
            <StyledLink
              to='/tags/new'
              visual='accent'>
              <Plus
                size={16}
                aria-hidden
              />{' '}
              タグを作成
            </StyledLink>
            <StyledLink
              to='/bookmarks/new'
              visual='accent'>
              <Plus
                size={16}
                aria-hidden
              />{' '}
              新規ブックマーク
            </StyledLink>
          </div>
        }
      />
    )
  }

  return (
    <ul className={entranceGrid}>
      {sorted.map((tag) => (
        <li key={tag.id}>
          <Link
            to='/'
            search={tagShelfSearch(tag.name)}
            className={entranceBox}
            onClick={() => {
              void touchTagLastUsed({ data: { id: tag.id } })
            }}>
            <span
              className={entranceBoxStripe}
              style={tag.color != null ? { backgroundColor: tag.color } : undefined}
              aria-hidden='true'
            />
            <span className={entranceBoxName}>
              <Package
                size={16}
                aria-hidden
              />{' '}
              {tag.name}
            </span>
            <span className={entranceBoxCount}>{tag.bookmarkCount}件</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
