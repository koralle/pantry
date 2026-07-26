import { Dialog } from '@base-ui/react/dialog'
import { useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Outlet, redirect, useRouter, useSearch } from '@tanstack/react-router'
import { LogOut, Menu, Plus, Settings, Tags, X } from 'lucide-react'
import { Suspense, useState, useTransition } from 'react'
import { ErrorBoundary, getErrorMessage } from 'react-error-boundary'
import type { FallbackProps } from 'react-error-boundary'
import { css } from 'styled-system/css'

import { UiError, UiLoading } from '../components/ui-state'
import { authClient } from '../features/auth/auth-client'
import { getSession } from '../features/auth/auth.function'
import { ShelfNavAsync } from '../features/tags/components/shelf-nav'
import { fetchShelfTags } from '../features/tags/tag.function'
import { StyledLink } from '../shared/components/styled-link'
import { button } from '../styles/ui'
import { defaultBookmarkSearch } from './_protected/-lib/bookmark-search-schema'

const shell = css({
  display: 'grid',
  minBlockSize: '100dvh',
  gridTemplateColumns: '1fr',
  md: {
    gridTemplateColumns: '16rem minmax(0, 1fr)'
  }
})

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

const shellContent = css({
  display: 'flex',
  flexDirection: 'column',
  minBlockSize: '100dvh',
  minInlineSize: '0'
})

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

const shelfChanger = css({
  color: 'fg.default',
  textDecoration: 'none',
  minBlockSize: 'touch',
  display: 'inline-flex',
  alignItems: 'center',
  paddingBlock: '1.5',
  paddingInline: '2',
  borderWidth: 'none',
  background: 'transparent',
  cursor: 'pointer',
  md: {
    display: 'none'
  }
})

const shellMain = css({
  flex: '1',
  paddingBlockStart: '5',
  paddingInline: '4',
  paddingBlockEnd: '8',
  md: {
    paddingBlockStart: '6',
    paddingInline: '6',
    paddingBlockEnd: '10'
  }
})

const shelfSheetBackdrop = css({
  position: 'fixed',
  inset: '0',
  background: 'overlay.backdrop'
})

const shelfSheet = css({
  position: 'fixed',
  insetInline: '0',
  insetBlockEnd: '0',
  maxBlockSize: '85dvh',
  overflow: 'auto',
  margin: '0',
  paddingBlockStart: '4',
  paddingInline: '3',
  paddingBlockEnd: '5',
  borderWidth: 'none',
  borderBlockStartWidth: 'thin',
  borderBlockStartStyle: 'solid',
  borderBlockStartColor: 'border.default',
  borderTopLeftRadius: 'sheet',
  borderTopRightRadius: 'sheet',
  background: 'bg.canvas',
  boxSizing: 'border-box',
  width: 'full'
})

const shelfSheetHeader = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '3',
  marginBlockEnd: '3',
  paddingInline: '1'
})

const shelfSheetTitle = css({
  margin: '0',
  fontSize: 'md2',
  fontWeight: 'bold'
})

const shelfSheetClose = css({
  color: 'fg.default',
  textDecoration: 'none',
  minBlockSize: 'touch',
  display: 'inline-flex',
  alignItems: 'center',
  paddingBlock: '1.5',
  paddingInline: '2',
  borderWidth: 'none',
  background: 'transparent',
  cursor: 'pointer'
})

const signOut = css(button.raw(), {
  color: 'fg.default',
  borderColor: 'transparent',
  background: 'transparent',
  paddingBlock: '1.5',
  paddingInline: '2'
})

export const Route = createFileRoute('/_protected')({
  beforeLoad: async ({ location }) => {
    const session = await getSession()

    if (!session) {
      throw redirect({
        to: '/sign-in',
        search: { redirect: location.href }
      })
    }

    return { user: session.user }
  },
  loader: async () => {
    const shelfTagsPromise = fetchShelfTags()
    return { shelfTagsPromise }
  },
  component: () => <Layout />
})

function ShelfNavError({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <UiError
      message={getErrorMessage(error) ?? '棚の読み込みに失敗しました'}
      onRetry={resetErrorBoundary}
    />
  )
}

function Layout() {
  const { shelfTagsPromise } = Route.useLoaderData()
  const queryClient = useQueryClient()
  const router = useRouter()
  const indexSearch = useSearch({ from: '/_protected/', shouldThrow: false })
  const [shelfOpen, setShelfOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const selection = {
    view: indexSearch?.view,
    tags: indexSearch?.tags
  }

  const handleSignOut = () => {
    startTransition(async () => {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            queryClient.clear()
          }
        }
      })

      startTransition(async () => {
        await router.navigate({ to: '/sign-in' })
      })
    })
  }

  const closeShelf = () => {
    setShelfOpen(false)
  }

  const renderShelfNav = (onNavigate?: () => void) => (
    <ErrorBoundary
      FallbackComponent={ShelfNavError}
      onReset={() => {
        void router.invalidate()
      }}>
      <Suspense fallback={<UiLoading label='棚を読み込み中' />}>
        <ShelfNavAsync
          shelfTagsPromise={shelfTagsPromise}
          selection={selection}
          onNavigate={onNavigate}
        />
      </Suspense>
    </ErrorBoundary>
  )

  return (
    <div className={shell}>
      <aside className={shelfRail}>
        <div>
          <StyledLink
            to='/'
            search={defaultBookmarkSearch}
            visual='brand'>
            Pantry
          </StyledLink>
        </div>
        <div className={shelfRailNav}>{renderShelfNav()}</div>
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

      <div className={shellContent}>
        <header className={shellHeader}>
          <div className={headerRow}>
            <StyledLink
              to='/'
              search={defaultBookmarkSearch}
              visual='brand'
              className={brandMobile}>
              Pantry
            </StyledLink>

            <Dialog.Root
              open={shelfOpen}
              onOpenChange={setShelfOpen}>
              <Dialog.Trigger className={shelfChanger}>
                <Menu
                  size={16}
                  aria-hidden
                />{' '}
                棚を変える
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Backdrop className={shelfSheetBackdrop} />
                <Dialog.Popup className={shelfSheet}>
                  <div className={shelfSheetHeader}>
                    <Dialog.Title className={shelfSheetTitle}>棚を選ぶ</Dialog.Title>
                    <Dialog.Close className={shelfSheetClose}>
                      <X
                        size={16}
                        aria-hidden
                      />{' '}
                      閉じる
                    </Dialog.Close>
                  </div>
                  {renderShelfNav(closeShelf)}
                </Dialog.Popup>
              </Dialog.Portal>
            </Dialog.Root>
          </div>

          <div className={headerRow}>
            <StyledLink
              to='/bookmarks/new'
              visual='plain'
              search={
                indexSearch?.tags !== undefined && indexSearch.tags.length > 0
                  ? { tags: indexSearch.tags }
                  : {}
              }>
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

        <main className={shellMain}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
