import { Dialog } from '@base-ui/react/dialog'
import { useQueryClient } from '@tanstack/react-query'
import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useRouter,
  useSearch
} from '@tanstack/react-router'
import { LogOut, Menu, Plus, Settings, Tags, X } from 'lucide-react'
import { Suspense, useState, useTransition } from 'react'
import { ErrorBoundary, getErrorMessage } from 'react-error-boundary'
import type { FallbackProps } from 'react-error-boundary'

import { UiError, UiLoading } from '../components/ui-state'
import { authClient } from '../features/auth/auth-client'
import { getSession } from '../features/auth/auth.function'
import { ShelfNavAsync } from '../features/tags/components/shelf-nav'
import { fetchShelfTags } from '../features/tags/tag.function'
import { defaultBookmarkSearch } from './_protected/-lib/bookmark-search-schema'

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
    <div className='pantry-shell'>
      <aside className='pantry-shelf-rail'>
        <div className='pantry-shelf-rail__brand'>
          <Link
            to='/'
            search={defaultBookmarkSearch}
            className='pantry-brand'>
            Pantry
          </Link>
        </div>
        <div className='pantry-shelf-rail__nav'>{renderShelfNav()}</div>
        <div className='pantry-shelf-rail__meta'>
          <Link
            to='/tags'
            search={{ limit: 50, offset: 0 }}>
            <Tags
              size={16}
              aria-hidden
            />{' '}
            タグ管理
          </Link>
          <Link to='/settings'>
            <Settings
              size={16}
              aria-hidden
            />{' '}
            設定
          </Link>
        </div>
      </aside>

      <div className='pantry-shell-content'>
        <header className='pantry-shell-header'>
          <div className='pantry-shell-header__start'>
            <Link
              to='/'
              search={defaultBookmarkSearch}
              className='pantry-brand pantry-brand--mobile'>
              Pantry
            </Link>

            <Dialog.Root
              open={shelfOpen}
              onOpenChange={setShelfOpen}>
              <Dialog.Trigger className='pantry-shelf-changer'>
                <Menu
                  size={16}
                  aria-hidden
                />{' '}
                棚を変える
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Backdrop className='pantry-shelf-sheet__backdrop' />
                <Dialog.Popup className='pantry-shelf-sheet'>
                  <div className='pantry-shelf-sheet__header'>
                    <Dialog.Title className='pantry-shelf-sheet__title'>棚を選ぶ</Dialog.Title>
                    <Dialog.Close className='pantry-shelf-sheet__close'>
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

          <div className='pantry-shell-header__actions'>
            <Link
              to='/bookmarks/new'
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
            </Link>
            <Link to='/settings'>
              <Settings
                size={16}
                aria-hidden
              />{' '}
              設定
            </Link>
            <button
              type='button'
              className='pantry-sign-out'
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

        <main className='pantry-shell-main'>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
