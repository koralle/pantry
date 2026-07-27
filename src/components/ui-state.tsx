import { LoaderCircle, PackageOpen, RefreshCw, TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'

import { StyledButton } from '../shared/components/styled-button'
import { skeleton, spinner, stateBox, stateErrorMessage, stateMessage } from '../styles/ui'

export function UiLoading({ label = '読み込み中' }: { label?: string }) {
  return (
    <output
      className={skeleton}
      aria-live='polite'>
      <LoaderCircle
        size={16}
        className={spinner}
        aria-hidden
      />{' '}
      {label}
    </output>
  )
}

export function UiEmpty({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className={stateBox}>
      <PackageOpen
        size={20}
        aria-hidden
      />
      <p className={stateMessage}>{title}</p>
      {action}
    </div>
  )
}

export function UiError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      className={stateBox}
      role='alert'>
      <TriangleAlert
        size={20}
        aria-hidden
      />
      <p className={stateErrorMessage}>{message}</p>
      {onRetry ? (
        <StyledButton
          visual='accent'
          onClick={onRetry}>
          <RefreshCw
            size={16}
            aria-hidden
          />{' '}
          再試行
        </StyledButton>
      ) : undefined}
    </div>
  )
}
