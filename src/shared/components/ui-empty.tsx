import { PackageOpen } from 'lucide-react'
import type { ReactNode } from 'react'

import { stateBox, stateMessage } from '../../styles/feedback'

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
