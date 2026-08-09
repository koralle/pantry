import { RefreshCw, TriangleAlert } from 'lucide-react'

import { stateBox, stateErrorMessage } from '../../styles/feedback'
import { StyledButton } from './styled-button'

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
          onPress={onRetry}>
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
