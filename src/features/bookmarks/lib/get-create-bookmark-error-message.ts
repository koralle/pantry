import { ORPCError } from '@orpc/client'

import type { BookmarkFormServerError } from '../components/bookmark-editor/bookmark-form/types'

const invalidTagMessage = '保存できないタグが含まれています。タグを選び直してください'

/**
 * `UNAUTHORIZED` は null を返す。クライアントが sign-in へ飛ばしたあと、
 * 同じ画面に「保存に失敗しました」が残ると、失敗原因が二重になる。
 * Error の class 名は見ない。transport が変わっても code 契約だけを見る。
 */
export function getCreateBookmarkErrorMessage(error: unknown): string | null {
  if (error instanceof ORPCError && error.defined) {
    if (error.code === 'UNAUTHORIZED') {
      return null
    }

    if (error.code === 'duplicate-url') {
      return '同じURLのブックマークが既にあります'
    }

    if (error.code === 'invalid-tag') {
      return invalidTagMessage
    }
  }

  return 'ブックマークの保存に失敗しました'
}

/**
 * 新規作成画面が BookmarkForm に渡す serverError。
 * 無効タグは summary だけでなく tags フィールドへも載せる。
 */
export function mapCreateBookmarkFailure(error: unknown): BookmarkFormServerError | null {
  const summary = getCreateBookmarkErrorMessage(error)
  if (summary === null) {
    return null
  }

  if (error instanceof ORPCError && error.defined && error.code === 'duplicate-url') {
    return {
      summary,
      fields: { url: 'この URL は既に登録されています' }
    }
  }

  if (error instanceof ORPCError && error.defined && error.code === 'invalid-tag') {
    return {
      summary,
      fields: { tags: invalidTagMessage }
    }
  }

  return { summary }
}
