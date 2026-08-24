import { ORPCError } from '@orpc/client'

/**
 * `UNAUTHORIZED` は null を返す。client が sign-in へ飛ばしたあと、
 * dialog に失敗表示が残ると原因が二重になる。Error の class 名は見ない。
 */
export function getDeleteBookmarkErrorMessage(error: unknown): string | null {
  if (error instanceof ORPCError && error.defined) {
    if (error.code === 'UNAUTHORIZED') {
      return null
    }

    if (error.code === 'bookmark-not-found') {
      return 'このブックマークは既に削除されています'
    }
  }

  return '削除に失敗しました'
}
