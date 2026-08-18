import { useNavigate } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { css } from 'styled-system/css'
import * as v from 'valibot'

import { StyledButton } from '../../../shared/components/styled-button'
import { StyledInput } from '../../../shared/components/styled-input'
import { StyledLabel } from '../../../shared/components/styled-label'
import { field, fieldError, fieldUrlRow } from '../../../styles/form'
import { addTag } from '../functions/add-tag'
import { tagNameSchema } from '../lib/tag-name-schema'

const inlineAddTag = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2'
})

export function InlineAddTag() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [tagError, setTagError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setTagError(null)

    try {
      v.parse(tagNameSchema, name)
    } catch {
      setTagError('タグ名を入力してください（32文字以内）')
      return
    }

    setIsPending(true)
    try {
      await addTag({ data: { name } })
      setName('')
      await navigate({ to: '/tags', search: { limit: 50, offset: 0 } })
    } catch (error) {
      if (error instanceof Error && error.name === 'TagNameAlreadyExistsError') {
        setTagError('そのタグ名は既に存在します')
      } else {
        setTagError('タグの作成に失敗しました')
      }
    } finally {
      setIsPending(false)
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
            disabled={isPending}
          />
          <StyledButton
            type='submit'
            isDisabled={isPending}>
            <Plus
              size={16}
              aria-hidden
            />{' '}
            {isPending ? '追加中...' : '追加'}
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
