import { ORPCError } from '@orpc/client'
import { describe, expect, test } from 'vitest'

import { getTitleFetchErrorMessage } from './get-title-fetch-error-message'

describe('getTitleFetchErrorMessage', () => {
  test('url-not-allowed を表示用メッセージへ写す', () => {
    const error = new ORPCError('url-not-allowed', { defined: true, status: 400 })
    expect(getTitleFetchErrorMessage(error)).toBe(
      'このURLにはアクセスできないため、手入力で続けられます'
    )
  })

  test('未知のエラーは Error の message を使わず汎用メッセージへ写す', () => {
    expect(getTitleFetchErrorMessage(new Error('internal detail'))).toBe(
      'タイトルを取得できませんでした。手入力で続けられます'
    )
    expect(getTitleFetchErrorMessage(null)).toBe(
      'タイトルを取得できませんでした。手入力で続けられます'
    )
  })
})
