import * as v from 'valibot'
import { describe, expect, test } from 'vitest'

import { executeFetchPageTitle, fetchPageTitleInputSchema } from './fetch-page-title'
import type { FetchPageTitle, FetchPageTitleOutput } from './fetch-page-title'

/**
 * 戻り値を固定した port。HTTP の詳細は Application の外。
 * 禁止 URL も例外ではなく port の戻り値として受け取るため、
 * Error class 名や message による分岐がどこにも生まれない。
 */
function fakeFetchPageTitle(output: FetchPageTitleOutput): FetchPageTitle {
  return async () => output
}

describe('fetchPageTitleInputSchema', () => {
  test('http / https の URL を受け付ける', () => {
    expect(v.parse(fetchPageTitleInputSchema, { url: 'https://example.com' })).toEqual({
      url: 'https://example.com'
    })
  })

  test('ftp などは拒否する', () => {
    expect(() => v.parse(fetchPageTitleInputSchema, { url: 'ftp://example.com' })).toThrow()
  })
})

describe('executeFetchPageTitle', () => {
  test('取得できた title を成功値として返す', async () => {
    const result = await executeFetchPageTitle({
      fetchPageTitle: fakeFetchPageTitle({ kind: 'fetched', title: 'Example' }),
      url: 'https://example.com'
    })

    expect(result).toEqual({
      ok: true,
      value: 'Example'
    })
  })

  test('取得不能・title なしは null 成功を返す', async () => {
    const result = await executeFetchPageTitle({
      fetchPageTitle: fakeFetchPageTitle({ kind: 'unavailable' }),
      url: 'https://example.com'
    })

    expect(result).toEqual({
      ok: true,
      value: null
    })
  })

  test('禁止 URL を url-not-allowed へ写す', async () => {
    const result = await executeFetchPageTitle({
      fetchPageTitle: fakeFetchPageTitle({ kind: 'url-not-allowed' }),
      url: 'http://localhost:3000'
    })

    expect(result).toEqual({
      ok: false,
      error: { code: 'url-not-allowed' }
    })
  })

  test('port の未知の失敗は潰さず throw する', async () => {
    await expect(
      executeFetchPageTitle({
        fetchPageTitle: async () => {
          throw new Error('dns exploded')
        },
        url: 'https://example.com'
      })
    ).rejects.toThrow('dns exploded')
  })
})
