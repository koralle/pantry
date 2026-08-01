import { CircleAlert } from 'lucide-react'

import { formSummary } from '../../../../styles/form'

type BookmarkFormSummaryProps = {
  readonly id: string
  readonly messages: readonly string[]
}

export function BookmarkFormSummary({ id, messages }: BookmarkFormSummaryProps) {
  if (messages.length === 0) {
    return null
  }

  return (
    <div
      id={id}
      className={formSummary}
      role='alert'
      aria-live='polite'>
      <p>
        <CircleAlert
          size={16}
          aria-hidden
        />{' '}
        次を確認してください
      </p>
      <ul>
        {messages.map((message) => (
          <li key={message}>{message}</li>
        ))}
      </ul>
    </div>
  )
}
