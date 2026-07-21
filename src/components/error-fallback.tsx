import { TriangleAlert } from 'lucide-react'
import { FallbackProps, getErrorMessage } from 'react-error-boundary'

export function ErrorFallback({ error }: FallbackProps) {
  return (
    <div role='alert'>
      <TriangleAlert
        size={20}
        aria-hidden
      />
      <p>{getErrorMessage(error)}</p>
    </div>
  )
}
