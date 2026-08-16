import type { LinkProps, RegisteredRouter } from '@tanstack/react-router'
import { useNavigate } from '@tanstack/react-router'
import { LogOut, Plus, Search, Settings, Tags } from 'lucide-react'
import { useEffect, useId, useState } from 'react';
import type { ReactNode } from 'react';
import { css, cx } from 'styled-system/css'

import { StyledLink } from '../../../shared/components/styled-link'
import { button } from '../../../styles/button'
import { formControl } from '../../../styles/form'
import { srOnly } from '../../../styles/sr-only'
import { useSignOut } from '../../auth/hooks/use-sign-out'
import type { BookmarkSearchSchema } from '../../navigation/lib/bookmark-search'
import { defaultBookmarkSearch } from '../../navigation/lib/bookmark-search'
import { buildListSearch } from '../../navigation/lib/bookmark-search-builders'

const shellHeader = css({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '2',
  minBlockSize: '4rem',
  paddingBlock: '2',
  paddingInline: '4',
  borderBlockEndWidth: 'thin',
  borderBlockEndStyle: 'solid',
  borderBlockEndColor: 'border.default',
  background: 'surface.header',
  md: {
    flexWrap: 'nowrap',
    gap: '3'
  }
})

const headerLead = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  order: 1,
  md: {
    order: 0
  }
})

const headerActions = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  order: 2,
  marginInlineStart: 'auto',
  md: {
    order: 0,
    marginInlineStart: '0'
  }
})

const brandMobile = css({
  md: {
    display: 'none'
  }
})

const mobileChromeAction = css({
  md: {
    display: 'none'
  }
})

const searchForm = css({
  display: 'flex',
  flex: '1 1 100%',
  minInlineSize: '0',
  gap: '2',
  order: 3,
  md: {
    flex: '1 1 auto',
    order: 0
  }
})

const searchInput = cx(
  formControl,
  css({
    flex: '1',
    minInlineSize: '0',
    minBlockSize: 'touch'
  })
)

const searchSubmit = css(button.raw({ size: 'md' }), {
  flexShrink: '0',
  paddingInline: '3'
})

const signOut = css(button.raw(), {
  display: 'none',
  color: 'fg.default',
  borderColor: 'transparent',
  background: 'transparent',
  paddingBlock: '1.5',
  paddingInline: '2',
  md: {
    display: 'inline-flex'
  }
})

export function AppHeader({
  newBookmarkSearch,
  listSearch,
  shelfTrigger
}: {
  readonly newBookmarkSearch: NonNullable<
    LinkProps<'a', RegisteredRouter, string, '/bookmarks/new'>['search']
  >
  readonly listSearch: BookmarkSearchSchema | undefined
  readonly shelfTrigger: ReactNode
}) {
  const { handleSignOut, isPending } = useSignOut()
  const navigate = useNavigate()
  const qInputId = useId()
  const [draftQ, setDraftQ] = useState(listSearch?.q ?? '')

  useEffect(() => {
    setDraftQ(listSearch?.q ?? '')
  }, [listSearch?.q])

  return (
    <header className={shellHeader}>
      <div className={headerLead}>
        <StyledLink
          to='/'
          search={defaultBookmarkSearch}
          visual='brand'
          className={brandMobile}>
          Pantry
        </StyledLink>

        {shelfTrigger}
      </div>

      <form
        className={searchForm}
        onSubmit={(event) => {
          event.preventDefault()
          const nextQ = draftQ.trim()
          const current = listSearch ?? defaultBookmarkSearch
          void navigate({
            to: '/',
            search:
              nextQ === ''
                ? buildListSearch(current, { clearQ: true })
                : buildListSearch(current, { q: nextQ })
          })
        }}>
        <label
          htmlFor={qInputId}
          className={srOnly}>
          検索
        </label>
        <input
          id={qInputId}
          type='search'
          className={searchInput}
          value={draftQ}
          onChange={(event) => {
            setDraftQ(event.target.value)
          }}
          placeholder='タイトル・URL・メモ'
        />
        <button
          type='submit'
          className={searchSubmit}
          aria-label='検索'>
          <Search
            size={16}
            aria-hidden
          />
        </button>
      </form>

      <div className={headerActions}>
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
          to='/tags'
          search={{ limit: 50, offset: 0 }}
          visual='plain'
          className={mobileChromeAction}
          aria-label='タグ管理'>
          <Tags
            size={16}
            aria-hidden
          />
        </StyledLink>
        <StyledLink
          to='/settings'
          visual='plain'
          className={mobileChromeAction}
          aria-label='設定'>
          <Settings
            size={16}
            aria-hidden
          />
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
