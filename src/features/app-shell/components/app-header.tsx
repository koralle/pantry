import type { LinkProps, RegisteredRouter } from '@tanstack/react-router'
import { LogOut, Plus, Settings } from 'lucide-react'
import type { ReactNode } from 'react'
import { css } from 'styled-system/css'

import { StyledLink } from '../../../shared/components/styled-link'
import { button } from '../../../styles/button'
import { useSignOut } from '../../auth/hooks/use-sign-out'
import { defaultBookmarkSearch } from '../../navigation/lib/bookmark-search'

const shellHeader = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '3',
  paddingBlock: '3',
  paddingInline: '4',
  borderBlockEndWidth: 'thin',
  borderBlockEndStyle: 'solid',
  borderBlockEndColor: 'border.default',
  background: 'surface.header'
})

const headerRow = css({
  display: 'flex',
  alignItems: 'center',
  gap: '3',
  flexWrap: 'wrap'
})

const brandMobile = css({
  md: {
    display: 'none'
  }
})

const signOut = css(button.raw(), {
  color: 'fg.default',
  borderColor: 'transparent',
  background: 'transparent',
  paddingBlock: '1.5',
  paddingInline: '2'
})

export function AppHeader({
  newBookmarkSearch,
  shelfTrigger
}: {
  readonly newBookmarkSearch: NonNullable<
    LinkProps<'a', RegisteredRouter, string, '/bookmarks/new'>['search']
  >
  readonly shelfTrigger: ReactNode
}) {
  const { handleSignOut, isPending } = useSignOut()

  return (
    <header className={shellHeader}>
      <div className={headerRow}>
        <StyledLink
          to='/'
          search={defaultBookmarkSearch}
          visual='brand'
          className={brandMobile}>
          Pantry
        </StyledLink>

        {shelfTrigger}
      </div>

      <div className={headerRow}>
        <StyledLink
          to='/bookmarks/new'
          visual='plain'
          search={newBookmarkSearch}>
          <Plus
            size={16}
            aria-hidden
          />{' '}
          新規
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
        <button
          type='button'
          className={signOut}
          onClick={handleSignOut}
          disabled={isPending}>
          <LogOut
            size={16}
            aria-hidden
          />{' '}
          ログアウト
        </button>
      </div>
    </header>
  )
}
