import { createFileRoute, useRouter, useRouterState } from '@tanstack/react-router'
import { ArrowLeft, CircleCheck } from 'lucide-react'
import { Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import * as v from 'valibot'

import { TagDetail } from '../../../../features/tags/components/tag-detail'
import { getRpcClient } from '../../../../rpc/runtime-client'
import { createErrorFallback } from '../../../../shared/components/error-fallback'
import { StyledLink } from '../../../../shared/components/styled-link'
import { UiLoading } from '../../../../shared/components/ui-loading'
import { flash } from '../../../../styles/flash'
import { workbench, workbenchNav } from '../../../../styles/workbench'

const tagIdParamSchema = v.pipe(v.string(), v.transform(Number), v.integer('Invalid tag id'))

const tagDetailSearchSchema = v.object({
  created: v.optional(v.boolean())
})

const DetailError = createErrorFallback('タグの読み込みに失敗しました')

export const Route = createFileRoute('/_protected/tags/$id/')({
  validateSearch: tagDetailSearchSchema,
  loader: async ({ params }) => {
    const id = v.parse(tagIdParamSchema, params.id)
    const client = await getRpcClient()
    const tagPromise = client.tags.byId({ id })
    return { tagPromise }
  },
  component: RouteComponent
})

function RouteComponent() {
  const { id } = Route.useParams()
  const { tagPromise } = Route.useLoaderData()
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
