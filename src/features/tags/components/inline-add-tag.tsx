import { Input } from '@base-ui/react'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import * as v from 'valibot'

import { tagNameSchema } from '../tag-name.schema'
import { addTag } from '../tag.function'

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
      className='pantry-inline-add-tag'
      onSubmit={handleSubmit}>
      <div className='pantry-field'>
        <label htmlFor='inline-add-tag-name'>クイック追加</label>
        <div className='pantry-field__url-row'>
          <Input
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
            className='pantry-button pantry-button--secondary'
            disabled={isPending}>
            {isPending ? '追加中...' : '追加'}
          </button>
        </div>
      </div>
      {tagError != null ? (
        <p
          className='pantry-field__error'
          role='alert'>
          {tagError}
        </p>
      ) : null}
    </form>
  )
}
