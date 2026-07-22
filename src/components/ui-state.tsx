import { LoaderCircle, PackageOpen, RefreshCw, TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'

export function UiLoading({ label = '読み込み中' }: { label?: string }) {
  return (
    <output
      className='pantry-skeleton'
      aria-live='polite'>
      <LoaderCircle
        size={16}
        className='pantry-spinner'
        aria-hidden
      />{' '}
      {label}
    </output>
  )
}

export function UiEmpty({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className='pantry-empty'>
      <PackageOpen
        size={20}
        aria-hidden
      />
      <p>{title}</p>
      {action}
    </div>
  )
}

export function UiError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      className='pantry-error'
      role='alert'>
      <TriangleAlert
        size={20}
        aria-hidden
      />
      <p>{message}</p>
      {onRetry ? (
        <button
          type='button'
          onClick={onRetry}>
          <RefreshCw
            size={16}
            aria-hidden
          />{' '}
          再試行
        </button>
      ) : undefined}
    </div>
  )
}
