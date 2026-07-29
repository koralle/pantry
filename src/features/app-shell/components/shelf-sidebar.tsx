import { Settings, Tags } from 'lucide-react'
import { css } from 'styled-system/css'

import { StyledLink } from '../../../shared/components/styled-link'
import { defaultBookmarkSearch } from '../../navigation/lib/bookmark-search'
import type { ShelfNavSelection } from '../../tags/components/shelf-nav'
import type { ShelfTag } from '../../tags/lib/tag-shelf'
import { ShelfNavPanel } from './shelf-nav-panel'

const shelfRail = css({
  display: 'none',
  md: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4',
    paddingBlock: '4',
    paddingInline: '3',
    borderInlineEndWidth: 'thin',
    borderInlineEndStyle: 'solid',
    borderInlineEndColor: 'border.default',
    background: 'surface.rail'
  }
})

const shelfRailNav = css({
  flex: '1',
  minBlockSize: '0',
  overflow: 'auto'
})

const shelfRailMeta = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '1',
  borderBlockStartWidth: 'thin',
  borderBlockStartStyle: 'solid',
  borderBlockStartColor: 'border.default',
  paddingBlockStart: '3'
})

export function ShelfSidebar({
  shelfTagsPromise,
  selection
}: {
  readonly shelfTagsPromise: Promise<ShelfTag[]>
  readonly selection: ShelfNavSelection
}) {
  return (
    <aside className={shelfRail}>
      <div>
        <StyledLink
          to='/'
          search={defaultBookmarkSearch}
          visual='brand'>
          Pantry
        </StyledLink>
      </div>
      <div className={shelfRailNav}>
        <ShelfNavPanel
          shelfTagsPromise={shelfTagsPromise}
          selection={selection}
        />
      </div>
      <div className={shelfRailMeta}>
        <StyledLink
          to='/tags'
          search={{ limit: 50, offset: 0 }}
          visual='plain'>
          <Tags
            size={16}
            aria-hidden
          />{' '}
          タグ管理
        </StyledLink>
        <StyledLink
          to='/settings'
          visual='plain'>
          <Settings
            size={16}
            aria-hidden
          />{' '}
          設定
        </StyledLink>
      </div>
    </aside>
  )
}
