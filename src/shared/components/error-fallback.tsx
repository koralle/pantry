import { getErrorMessage } from 'react-error-boundary'
import type { FallbackProps } from 'react-error-boundary'

import { UiError } from './ui-error'

/**
 * `FallbackComponent`(react-error-boundary)向けのフォールバックを生成する。
 *
 * 画面ごとに「メッセージだけ違う同一のフォールバック」が重複していたため、
 * このファクトリに集約する。返り値はモジュール直下で一度だけ呼び出して
 * 定数化すること(`const X = createErrorFallback('...')`)。描画ごとに呼ぶと
 * コンポーネントの識別子が変わり、エラー状態のたびに再マウントされる。
 */
export function createErrorFallback(fallbackMessage: string) {
  return function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
    return (
      <UiError
        message={getErrorMessage(error) ?? fallbackMessage}
        onRetry={resetErrorBoundary}
      />
    )
  }
}
