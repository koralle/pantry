import type { UpdateBookmarkFailureCode } from '../../lib/update-bookmark-failure'
import type { BookmarkEditorError } from './bookmark-form'

/**
 * 更新結果の failure code を、BookmarkEditor が保持する画面用エラーへ変換する。
 * code は transport から切り離された値で、Error class 名による分岐はしない。
 */
export function mapUpdateBookmarkFailure(code: UpdateBookmarkFailureCode): BookmarkEditorError {
  switch (code) {
    case 'duplicate-url': {
      return {
        form: {
          summary: '同じ URL のブックマークが既にあります',
          fields: { url: 'この URL は既に登録されています' }
        }
      }
    }
    case 'bookmark-not-found': {
      return { form: { summary: 'このブックマークは見つかりません' } }
    }
    case 'invalid-tag': {
      return { form: { summary: '保存できないタグ情報が含まれています' } }
    }
    case 'unexpected': {
      return { form: { summary: '保存に失敗しました。時間をおいて再度お試しください' } }
    }
  }
}
