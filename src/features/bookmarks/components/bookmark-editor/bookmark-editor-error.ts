import type { UpdateBookmarkError } from '../../application/execute-update-bookmark'
import type { BookmarkEditorError } from './bookmark-form'

/**
 * Application 層の UpdateBookmarkError を BookmarkEditor が保持する画面用エラーへ変換する。
 * ブックマーク編集画面で表示するフォームエラーへ変換する。
 */
export function mapUpdateBookmarkError(error: UpdateBookmarkError): BookmarkEditorError {
  switch (error.code) {
    case 'bookmark-not-found': {
      return { form: { summary: 'このブックマークは見つかりません' } }
    }
    case 'duplicate-url': {
      return {
        form: {
          summary: '同じ URL のブックマークが既にあります',
          fields: { url: 'この URL は既に登録されています' }
        }
      }
    }
    case 'invalid-title': {
      return {
        form: {
          summary: '入力内容を確認してください',
          fields: { title: 'タイトルを入力してください' }
        }
      }
    }
    case 'invalid-url': {
      return {
        form: {
          summary: '入力内容を確認してください',
          fields: { url: '有効な URL を入力してください' }
        }
      }
    }
    case 'duplicate-tag-id': {
      return { form: { summary: '保存できないタグ情報が含まれています' } }
    }
    case 'invalid-tag': {
      return { form: { summary: '保存できないタグ情報が含まれています' } }
    }
    case 'unexpected-error': {
      return { form: { summary: '保存に失敗しました。時間をおいて再度お試しください' } }
    }
  }
}
