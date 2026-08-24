import * as v from 'valibot'

import { err, ok } from '../../../shared/domain/result'
import type { Result } from '../../../shared/domain/result'
import { bookmarkUrlSchema } from '../domain/bookmark-values'

export const fetchPageTitleInputSchema = v.object({
  url: bookmarkUrlSchema
})

/**
 * 外部取得の結果を例外ではなく戻り値で受け取る narrow port。
 * 禁止 URL も取得不能も port output として届くため、
 * Application は Error class 名や message を見ない。
 */
export type FetchPageTitleOutput =
  | { readonly kind: 'fetched'; readonly title: string }
  | { readonly kind: 'unavailable' }
  | { readonly kind: 'url-not-allowed' }

export type FetchPageTitle = (url: string) => Promise<FetchPageTitleOutput>

/** 手入力を継続できる失敗は null 成功に載せ、禁止 URL だけを Expected Error へ写す。 */
export type FetchPageTitleError = {
  readonly code: 'url-not-allowed'
}

export async function executeFetchPageTitle(params: {
  readonly fetchPageTitle: FetchPageTitle
  readonly url: string
}): Promise<Result<string | null, FetchPageTitleError>> {
  const output = await params.fetchPageTitle(params.url)

  if (output.kind === 'url-not-allowed') {
    return err({ code: 'url-not-allowed' })
  }
  if (output.kind === 'fetched') {
    return ok(output.title)
  }

  return ok(null)
}
