import type { ReactNode } from 'react'

type PantryMotionKind = 'fade-up' | 'crossfade'

const kindClassName: Record<PantryMotionKind, string> = {
  'fade-up': 'pantry-motion-fade-up',
  crossfade: 'pantry-motion-crossfade'
}

/**
 * Lightweight enter animation wrapper.
 * React 19.2.x does not export `<ViewTransition>` in this catalog build,
 * so motion is CSS-class based and SSR-safe (no browser APIs at render).
 */
export function PantryMotion({
  kind,
  children,
  className
}: {
  readonly kind: PantryMotionKind
  readonly children: ReactNode
  readonly className?: string
}) {
  const classes = [kindClassName[kind], className].filter(Boolean).join(' ')
  return <div className={classes}>{children}</div>
}
