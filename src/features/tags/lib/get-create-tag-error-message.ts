import { ORPCError } from '@orpc/client'

/**
 * `UNAUTHORIZED` は null を返す。クライアントが sign-in へ飛ばしたあと、
 * 同じ画面に「タグの作成に失敗しました」が残ると、失敗原因が二重になる。
 * Error の class 名は見ない。transport が変わっても code 契約だけを見る。
 */
export function getCreateTagErrorMessage(error: unknown): string | null {
  if (error instanceof ORPCError && error.defined) {
    if (error.code === 'UNAUTHORIZED') {
      return null
    }

    if (error.code === 'tag-name-already-exists') {
      return 'そのタグ名は既に存在します'
    }
  }

  return 'タグの作成に失敗しました'
}
