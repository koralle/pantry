import type { ReactNode } from 'react'
import { css, cx } from 'styled-system/css'

type PantryMotionKind = 'fade-up' | 'crossfade'

const kindClass: Record<PantryMotionKind, string> = {
  'fade-up': css({ animationStyle: 'fadeUp' }),
  crossfade: css({ animationStyle: 'crossfade' })
}

export function PantryMotion({
  kind,
  children,
  className
}: {
  readonly kind: PantryMotionKind
  readonly children: ReactNode
  readonly className?: string
}) {
  return <div className={cx(kindClass[kind], className)}>{children}</div>
}
