import { CircleAlert } from 'lucide-react'

import { formSummary } from '../../../../../styles/form'

type BookmarkFormSummaryProps = {
  readonly id: string
  readonly messages: readonly string[]
}

// Summary の重複除去はここでだけ行う。BookmarkForm 側では複数の発生源
// (Conform / server / title fetch) からのメッセージ候補を素朴に集めるだけにして、
// 「どのエラーの重複を許すか」という判断を一箇所に集める。
// 完全一致に限定するのは、意味や field が異なるエラーを文字列比較でまとめないため。
function dedupeExactMatchMessages(messages: readonly string[]): readonly string[] {
  return [...new Set(messages)]
}

export function BookmarkFormSummary({ id, messages }: BookmarkFormSummaryProps) {
  const uniqueMessages = dedupeExactMatchMessages(messages)

  if (uniqueMessages.length === 0) {
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
        {uniqueMessages.map((message) => (
          <li key={message}>{message}</li>
        ))}
      </ul>
    </div>
  )
}
