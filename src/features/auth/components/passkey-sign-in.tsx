import { WebAuthnAbortService } from '@simplewebauthn/browser'
import { useRouter } from '@tanstack/react-router'
import { CircleAlert, KeyRound } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { css } from 'styled-system/css'

import { StyledButton } from '../../../shared/components/styled-button'
import { formSummary } from '../../../styles/form'
import { authClient } from '../lib/auth-client'
import { getPasskeySignInErrorMessage } from '../lib/passkey-messages'
import { isConditionalMediationAvailable, isWebAuthnAvailable } from '../lib/webauthn-support'

const passkeySignIn = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '5',
  marginBlockStart: '2'
})

const passkeySignInActions = css({
  display: 'flex',
  '& > button': {
    inlineSize: 'stretch'
  }
})

const passkeyDivider = css({
  display: 'grid',
  gridTemplateColumns: '1fr auto 1fr',
  alignItems: 'center',
  columnGap: '3',
  color: 'fg.muted',
  fontSize: 'xs',
  '&::before, &::after': {
    content: '""',
    borderBlockStartWidth: 'thin',
    borderBlockStartStyle: 'solid',
    borderBlockStartColor: 'border.default'
  }
})

export function PasskeySignIn({ redirect }: { readonly redirect: string | undefined }) {
  const router = useRouter()
  const [webAuthnAvailable, setWebAuthnAvailable] = useState(true)
  const [isPending, setIsPending] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const explicitInFlight = useRef(false)

  useEffect(() => {
    if (!isWebAuthnAvailable()) {
      setWebAuthnAvailable(false)
      return
    }

    setWebAuthnAvailable(true)

    let ignore = false

    void (async () => {
      if (!(await isConditionalMediationAvailable())) {
        return
      }

      const { data, error } = await authClient.signIn.passkey({ autoFill: true })
      if (ignore || explicitInFlight.current) {
        return
      }

      if (error != null) {
        const message = getPasskeySignInErrorMessage(error)
        if (message != null) {
          setErrorMessage(message)
        }
        return
      }

      if (data != null) {
        await router.navigate({ to: redirect ?? '/' })
      }
    })()

    return () => {
      ignore = true
      WebAuthnAbortService.cancelCeremony()
    }
  }, [redirect, router])

  if (!webAuthnAvailable) {
    return null
  }

  const handlePasskeySignIn = () => {
    setErrorMessage(null)
    explicitInFlight.current = true
    WebAuthnAbortService.cancelCeremony()
    setIsPending(true)

    void (async () => {
      try {
        const { error } = await authClient.signIn.passkey()
        if (error != null) {
          const message = getPasskeySignInErrorMessage(error)
          if (message != null) {
            setErrorMessage(message)
          }
          return
        }

        await router.navigate({ to: redirect ?? '/' })
      } catch {
        setErrorMessage(getPasskeySignInErrorMessage({}))
      } finally {
        explicitInFlight.current = false
        setIsPending(false)
      }
    })()
  }

  return (
    <div className={passkeySignIn}>
      {errorMessage != null ? (
        <div
          className={formSummary}
          role='alert'
          aria-live='polite'>
          <p>
            <CircleAlert
              size={16}
              aria-hidden
            />{' '}
            {errorMessage}
          </p>
        </div>
      ) : null}

      <div className={passkeySignInActions}>
        <StyledButton
          type='button'
          visual='accent'
          onPress={handlePasskeySignIn}
          isDisabled={isPending}>
          <KeyRound
            size={16}
            aria-hidden
          />
          {isPending ? 'パスキーで認証中...' : 'パスキーでログイン'}
        </StyledButton>
      </div>

      <div className={passkeyDivider}>または</div>
    </div>
  )
}
