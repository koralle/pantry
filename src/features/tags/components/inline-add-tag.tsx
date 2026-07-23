import { Input } from '@base-ui/react'
import { useNavigate } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { css } from 'styled-system/css'
import * as v from 'valibot'

import { button, field, fieldError, fieldInput, fieldLabel, fieldUrlRow } from '../../../styles/ui'
import { tagNameSchema } from '../tag-name.schema'
import { addTag } from '../tag.function'

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

    let parsedName: string
    try {
      parsedName = v.parse(tagNameSchema, name)
    } catch {
      setTagError('タグ名を入力してください（32文字以内）')
      return
    }

    setIsPending(true)
    try {
      await addTag({ data: { name: parsedName } })
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
        <label
          className={fieldLabel}
          htmlFor='inline-add-tag-name'>
          クイック追加
        </label>
        <div className={fieldUrlRow}>
          <Input
            className={fieldInput}
            id='inline-add-tag-name'
            value={name}
            type='text'
            onValueChange={(newValue) => {
              setName(newValue)
            }}
            disabled={isPending}
          />
          <button
            type='submit'
            className={button()}
            disabled={isPending}>
            <Plus
              size={16}
              aria-hidden
            />{' '}
            {isPending ? '追加中...' : '追加'}
          </button>
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
