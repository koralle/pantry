import { useMutation } from '@tanstack/react-query'
import { useNavigate, useRouter } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { css } from 'styled-system/css'
import * as v from 'valibot'

import { orpc } from '../../../rpc/query'
import { StyledButton } from '../../../shared/components/styled-button'
import { StyledInput } from '../../../shared/components/styled-input'
import { StyledLabel } from '../../../shared/components/styled-label'
import { field, fieldError, fieldUrlRow } from '../../../styles/form'
import { getCreateTagErrorMessage } from '../lib/get-create-tag-error-message'
import { refreshAfterCreateTag } from '../lib/refresh-after-create-tag'
import { tagNameSchema } from '../lib/tag-name-schema'

const inlineAddTag = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2'
})

/**
 * 一覧上の短い作成経路。専用画面と同じ error code 契約に載せ、
 * Error の class 名では分岐しない。
 */
export function InlineAddTag() {
  const navigate = useNavigate()
  const router = useRouter()
  const [name, setName] = useState('')
  const [tagError, setTagError] = useState<string | null>(null)
  const mutation = useMutation(
    orpc.tags.create.mutationOptions({
      onSuccess: () => {
        refreshAfterCreateTag(router)
      }
    })
  )

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setTagError(null)

    try {
      v.parse(tagNameSchema, name)
    } catch {
      setTagError('タグ名を入力してください（32文字以内）')
      return
    }

    try {
      await mutation.mutateAsync({ name })
      setName('')
      await navigate({ to: '/tags', search: { limit: 50, offset: 0 } })
    } catch (error) {
      const message = getCreateTagErrorMessage(error)
      if (message !== null) {
        setTagError(message)
      }
    }
  }

  return (
    <form
      className={inlineAddTag}
      onSubmit={handleSubmit}>
      <div className={field}>
        <StyledLabel htmlFor='inline-add-tag-name'>クイック追加</StyledLabel>
        <div className={fieldUrlRow}>
          <StyledInput
            id='inline-add-tag-name'
            value={name}
            type='text'
            onChange={(event) => {
              setName(event.target.value)
            }}
            disabled={mutation.isPending}
          />
          <StyledButton
            type='submit'
            isDisabled={mutation.isPending}>
            <Plus
              size={16}
              aria-hidden
            />{' '}
            {mutation.isPending ? '追加中...' : '追加'}
          </StyledButton>
        </div>
      </div>
      {tagError != null ? (
        <p
          className={fieldError}
          role='alert'>
          {tagError}
        </p>
      ) : null}
    </form>
  )
}
