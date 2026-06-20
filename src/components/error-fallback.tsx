import { FallbackProps, getErrorMessage } from 'react-error-boundary'

export function ErrorFallback({ error }: FallbackProps) {
  return (
    <div role='alert'>
      <p>{getErrorMessage(error)}</p>
    </div>
  )
}
