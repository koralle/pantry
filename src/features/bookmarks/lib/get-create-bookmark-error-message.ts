import { ORPCError } from '@orpc/client'

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
      return '保存できないタグ情報が含まれています'
    }
  }

  return 'ブックマークの保存に失敗しました'
}
