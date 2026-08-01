import type { UpdateBookmarkError } from '../application/execute-update-bookmark'
import type { BookmarkEditorError } from './bookmark-form'

/**
 * Application 層の UpdateBookmarkError を BookmarkEditor が保持する画面用エラーへ変換する。
 * ここで form / tags を分離することで、以降の props 配線が「どこに表示するか」で
 * 自然に分岐する。BookmarkForm summary へタグエラーを混ぜないという設計判断を、
 * 分岐先を型 (BookmarkEditorError.form / BookmarkEditorError.tags) で表現している。
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
      return { tags: '同じタグが重複しています' }
    }
    case 'invalid-tag': {
      return {
        tags:
          error.cause.code === 'tag-not-owned'
            ? '選択したタグを利用できません'
            : '選択したタグが見つかりません'
      }
    }
    case 'unexpected-error': {
      return { form: { summary: '保存に失敗しました。時間をおいて再度お試しください' } }
    }
  }
}
