import { ORPCError } from '@orpc/client'

/**
 * Title 取得の失敗文言は code 契約だけから決める。
 * Error の message や class 名は transport の内部詳細なので表示に使わない。
 */
export function getTitleFetchErrorMessage(error: unknown): string {
  if (error instanceof ORPCError && error.defined && error.code === 'url-not-allowed') {
    return 'このURLにはアクセスできないため、手入力で続けられます'
  }

  return 'タイトルを取得できませんでした。手入力で続けられます'
}
