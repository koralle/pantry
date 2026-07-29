import { Link, useRouter, useRouterState } from '@tanstack/react-router'
import { ArrowLeft, Bookmark, CircleCheck, Pencil, Pin } from 'lucide-react'
import { Suspense, use } from 'react'
import { ErrorBoundary, getErrorMessage } from 'react-error-boundary'
import type { FallbackProps } from 'react-error-boundary'
import { css, cx } from 'styled-system/css'

import { StyledLink } from '../../../shared/components/styled-link'
import { UiError, UiLoading } from '../../../shared/components/ui-state'
import { button } from '../../../styles/button'
import { flash } from '../../../styles/flash'
import { workbench, workbenchNav, workbenchTitle } from '../../../styles/workbench'
import { tagShelfSearch } from '../../navigation/lib/bookmark-search-builders'
import type { getTag } from '../functions/get-tag'

const shelfDot = css({
  inlineSize: '2.5',
  blockSize: '2.5',
  borderRadius: 'full',
  background: 'border.default',
  flexShrink: '0'
})

const tagDetailHeader = css({
  display: 'flex',
  alignItems: 'center',
  gap: '3'
})

const tagDetailDot = css({
  inlineSize: '3.5',
  blockSize: '3.5'
})

const tagDetailMeta = css({
  display: 'grid',
  gap: '3',
  margin: '0',
  '& div': {
    display: 'grid',
    gap: '1'
  },
  '& dt': {
    color: 'fg.muted',
    fontSize: 'xs2'
  },
  '& dd': {
    margin: '0'
  }
})

const detailActions = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '3',
  alignItems: 'center'
})

type TagDetailScreenProps = {
  readonly id: string
  readonly tagPromise: Promise<Awaited<ReturnType<typeof getTag>>>
}

function DetailError({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <UiError
      message={getErrorMessage(error) ?? 'タグの読み込みに失敗しました'}
      onRetry={resetErrorBoundary}
    />
  )
}

export function TagDetailScreen({ id, tagPromise }: TagDetailScreenProps) {
  const router = useRouter()

  const { newTagCreated, tagUpdated } = useRouterState({
    select: (s) => s.location.state
  })

  return (
    <div className={workbench}>
      {newTagCreated ? (
        <output className={flash}>
          <CircleCheck
            size={16}
            aria-hidden
          />{' '}
          タグを登録しました
        </output>
      ) : null}
      {tagUpdated ? (
        <output className={flash}>
          <CircleCheck
            size={16}
            aria-hidden
          />{' '}
          タグを更新しました
        </output>
      ) : null}

      <nav className={workbenchNav}>
        <StyledLink
          to='/tags'
          search={{ limit: 50, offset: 0 }}
          visual='accent'>
          <ArrowLeft
            size={16}
            aria-hidden
          />{' '}
          一覧へ戻る
        </StyledLink>
      </nav>

      <ErrorBoundary
        FallbackComponent={DetailError}
        onReset={() => {
          void router.invalidate()
        }}>
        <Suspense fallback={<UiLoading label='タグを読み込み中' />}>
          <TagDetail
            id={id}
            tagPromise={tagPromise}
          />
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}

function TagDetail({
  id,
  tagPromise
}: {
  readonly id: string
  readonly tagPromise: Promise<Awaited<ReturnType<typeof getTag>>>
}) {
  const tag = use(tagPromise)

  return (
    <>
      <header className={tagDetailHeader}>
        <span
          className={cx(shelfDot, tagDetailDot)}
          style={tag.color != null ? { backgroundColor: tag.color } : undefined}
          aria-hidden='true'
        />
        <h1 className={workbenchTitle}>{tag.name}</h1>
      </header>

      <dl className={tagDetailMeta}>
        <div>
          <dt>ピン</dt>
          <dd>
            {tag.pinned ? (
              <>
                <Pin
                  size={16}
                  aria-hidden
                />{' '}
                留めている
              </>
            ) : (
              'なし'
            )}
          </dd>
        </div>
        <div>
          <dt>並び順</dt>
          <dd>{tag.sortOrder}</dd>
        </div>
      </dl>

      <div className={detailActions}>
        <Link
          to='/'
          search={tagShelfSearch(tag.name)}
          className={button({ visual: 'accent' })}>
          <Bookmark
            size={16}
            aria-hidden
          />{' '}
          この棚のブックマークを見る
        </Link>
        <Link
          to='/tags/$id/edit'
          params={{ id }}
          className={button()}>
          <Pencil
            size={16}
            aria-hidden
          />{' '}
          編集
        </Link>
      </div>
    </>
  )
}
