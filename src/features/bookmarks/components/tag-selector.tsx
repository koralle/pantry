import { Input } from '@base-ui/react'
import { Plus, Search } from 'lucide-react'
import { useState } from 'react'
import * as v from 'valibot'

import type { TagSelectType } from '../../../db/schema/tag'
import { tagNameSchema } from '../../tags/tag-name.schema'
import { addTag } from '../../tags/tag.function'

interface TagSelectorProps {
  allTags: TagSelectType[]
  selectedTagIds: number[]
  onChange: (tagIds: number[]) => void
}

export function TagSelector({ allTags, selectedTagIds, onChange }: TagSelectorProps) {
  const [query, setQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  const filteredTags = allTags.filter((tag) =>
    tag.name.toLowerCase().includes(query.trim().toLowerCase())
  )

  function toggleTag(tagId: number) {
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter((id) => id !== tagId))
    } else {
      onChange([...selectedTagIds, tagId])
    }
  }

  async function handleCreate() {
    setError(null)
    let parsedName: string
    try {
      parsedName = v.parse(tagNameSchema, query)
    } catch {
      setError('タグ名を入力してください（32文字以内）')
      return
    }

    setIsPending(true)
    try {
      const { id } = await addTag({ data: { name: parsedName } })
      onChange([...selectedTagIds, id])
      setQuery('')
    } catch (err) {
      if (err instanceof Error && err.name === 'TagNameAlreadyExistsError') {
        const existing = allTags.find((tag) => tag.name === parsedName)
        if (existing != null && !selectedTagIds.includes(existing.id)) {
          onChange([...selectedTagIds, existing.id])
        }
        setError('そのタグ名は既に存在します（既存タグを選択しました）')
        setQuery('')
      } else {
        setError('タグの作成に失敗しました')
      }
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div>
      <fieldset>
        <legend>タグ</legend>
        <div>
          {filteredTags.map((tag) => (
            <label key={tag.id}>
              <input
                type='checkbox'
                checked={selectedTagIds.includes(tag.id)}
                onChange={() => toggleTag(tag.id)}
              />
              {tag.name}
            </label>
          ))}
        </div>
        <label htmlFor='tag-selector-query'>
          <Search
            size={16}
            aria-hidden
          />{' '}
          タグを絞り込む / 新規作成
          <Input
            id='tag-selector-query'
            value={query}
            type='text'
            placeholder='タグを絞り込む / 新規作成'
            onValueChange={(newValue) => {
              setQuery(newValue)
            }}
          />
        </label>
        <button
          type='button'
          onClick={handleCreate}
          disabled={isPending}>
          <Plus
            size={16}
            aria-hidden
          />{' '}
          {isPending ? '作成中...' : 'この名前で作成'}
        </button>
        {error != null && <p role='alert'>{error}</p>}
      </fieldset>
    </div>
  )
}
