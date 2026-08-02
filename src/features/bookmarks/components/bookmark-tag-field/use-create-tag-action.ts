import { useState } from 'react'
import * as v from 'valibot'

import { err, ok } from '../../../../shared/domain/result'
import type { Result } from '../../../../shared/domain/result'
import { tagNameSchema } from '../../../tags/domain/tag-values'
import type { CreateTag, CreateTagError, SelectableTag } from './types'

function createErrorMessage(error: CreateTagError): string {
  switch (error.code) {
    case 'invalid-tag-name': {
      return 'タグ名を入力してください（32文字以内）'
    }
    case 'duplicate-tag-name': {
      return 'そのタグ名は既に存在します'
    }
    case 'unexpected-error': {
      return 'タグの作成に失敗しました'
    }
    default: {
      return 'タグの作成に失敗しました'
    }
  }
}

function parseCreateName(raw: string): Result<string, CreateTagError> {
  const parsed = v.safeParse(tagNameSchema, raw)
  if (!parsed.success) {
    return err({ code: 'invalid-tag-name', field: 'name' })
  }
  return ok(parsed.output)
}

async function runCreateTag(
  query: string,
  onCreateTag: CreateTag
): Promise<Result<SelectableTag, CreateTagError>> {
  const nameResult = parseCreateName(query)
  if (!nameResult.ok) {
    return nameResult
  }
  return onCreateTag(nameResult.value)
}

export function useCreateTagAction(
  onCreateTag: CreateTag,
  onCreated?: (tag: SelectableTag) => void
) {
  const [createError, setCreateError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  async function createFromQuery(query: string) {
    setCreateError(null)
    setCreating(true)
    try {
      const result = await runCreateTag(query, onCreateTag)
      if (!result.ok) {
        setCreateError(createErrorMessage(result.error))
        return
      }
      onCreated?.(result.value)
    } finally {
      setCreating(false)
    }
  }

  return {
    createError,
    creating,
    clearCreateError: () => setCreateError(null),
    createFromQuery
  }
}
