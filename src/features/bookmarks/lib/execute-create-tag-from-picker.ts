import { ORPCError } from '@orpc/client'

import { toTagName } from '../../tags/domain/tag-values'
import { getCreateTagErrorMessage } from '../../tags/lib/get-create-tag-error-message'
import { resolveCreateTagConflict } from '../components/bookmark-tag-picker/lib'
import type { NamedTag } from '../components/bookmark-tag-picker/lib'

export type CreateTagFromPickerState =
  | { readonly status: 'idle' }
  | { readonly status: 'created'; readonly tag: NamedTag }
  | { readonly status: 'error'; readonly message: string }

type CreateTagFromPickerPayload = {
  readonly name: string
}

export type CreateTagFromPickerAction = (
  previousState: CreateTagFromPickerState,
  payload: CreateTagFromPickerPayload
) => Promise<CreateTagFromPickerState>

function isNameConflict(error: unknown): boolean {
  return error instanceof ORPCError && error.defined && error.code === 'tag-name-already-exists'
}

export async function executeCreateTagFromPicker(params: {
  readonly name: string
  readonly createTag: (name: string) => Promise<{ readonly id: number }>
  readonly loadTags: () => Promise<readonly NamedTag[]>
}): Promise<CreateTagFromPickerState> {
  try {
    const created = await params.createTag(params.name)
    return {
      status: 'created',
      tag: { id: created.id, name: toTagName(params.name).display }
    }
  } catch (error: unknown) {
    if (isNameConflict(error)) {
      const existing = resolveCreateTagConflict({
        query: params.name,
        tags: await params.loadTags()
      })
      if (existing !== null) {
        return { status: 'created', tag: existing }
      }
      return { status: 'error', message: 'タグの作成に失敗しました' }
    }

    const message = getCreateTagErrorMessage(error)
    if (message === null) {
      return { status: 'idle' }
    }
    return { status: 'error', message }
  }
}
