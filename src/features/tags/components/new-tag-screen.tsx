import { useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'

import { StyledLink } from '../../../shared/components/styled-link'
import { workbench, workbenchLead, workbenchNav, workbenchTitle } from '../../../styles/workbench'
import { addTag } from '../functions/add-tag'
import { TagForm } from './tag-form'

export function NewTagScreen() {
  const navigate = useNavigate()

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
      <p className={workbenchLead}>箱の名前を付け、必要ならピンと色も決めます</p>

      <TagForm
        initialValues={{ name: '', pinned: false, color: null, sortOrder: 0 }}
        legend='タグ新規登録'
        submitLabel='登録'
        pendingLabel='登録中...'
        onSubmit={async ({ name, pinned, color, sortOrder }) => {
          const { id } = await addTag({
            data: {
              name,
              pinned,
              color,
              sortOrder
            }
          })

          await navigate({
            to: '/tags/$id',
            params: { id: String(id) },
            state: { newTagCreated: true }
          })
        }}
        mapError={(error) => {
          if (error instanceof Error && error.name === 'TagNameAlreadyExistsError') {
            return 'そのタグ名は既に存在します'
          }
          return error instanceof Error ? error.message : 'タグの作成に失敗しました'
        }}
      />
    </div>
  )
}
