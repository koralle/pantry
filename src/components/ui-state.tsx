import type { ReactNode } from 'react'

export function UiLoading({ label = '読み込み中' }: { label?: string }) {
  return (
    <output
      className='pantry-skeleton'
      aria-live='polite'>
      {label}
    </output>
  )
}

export function UiEmpty({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className='pantry-empty'>
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
      <p>{message}</p>
      {onRetry ? (
        <button
          type='button'
          onClick={onRetry}>
          再試行
        </button>
      ) : undefined}
    </div>
  )
}
