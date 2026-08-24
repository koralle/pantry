import { useMutation } from '@tanstack/react-query'
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'

import { TagForm } from '../../../features/tags/components/tag-form'
import { getCreateTagErrorMessage } from '../../../features/tags/lib/get-create-tag-error-message'
import { refreshAfterCreateTag } from '../../../features/tags/lib/refresh-after-create-tag'
import { orpc } from '../../../rpc/query'
import { StyledLink } from '../../../shared/components/styled-link'
import { workbench, workbenchLead, workbenchNav, workbenchTitle } from '../../../styles/workbench'

export const Route = createFileRoute('/_protected/tags/new')({
  component: RouteComponent
})

function RouteComponent() {
  const navigate = useNavigate()
  const router = useRouter()
  const mutation = useMutation(
    orpc.tags.create.mutationOptions({
      onSuccess: () => {
        refreshAfterCreateTag(router)
      }
    })
  )

  return (
    <div className={workbench}>
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

      <h1 className={workbenchTitle}>タグ新規作成</h1>
      <p className={workbenchLead}>名前を付け、必要ならピンと色も決めます</p>

      <TagForm
        initialValues={{ name: '', pinned: false, color: null, sortOrder: 0 }}
        legend='タグ新規登録'
        submitLabel='登録'
        pendingLabel='登録中...'
        onSubmit={async ({ name, pinned, color, sortOrder }) => {
          const { id } = await mutation.mutateAsync({
            name,
            pinned,
            color,
            sortOrder
          })

          await navigate({
            to: '/tags/$id',
            params: { id: String(id) },
            state: { newTagCreated: true }
          })
        }}
        mapError={getCreateTagErrorMessage}
      />
    </div>
  )
}
