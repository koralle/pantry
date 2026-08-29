import { CircleAlert, KeyRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { css, cx } from 'styled-system/css'

import { StyledButton } from '../../../../shared/components/styled-button'
import { flash } from '../../../../styles/flash'
import { formSummary } from '../../../../styles/form'
import { sectionLabel } from '../../../../styles/type'
import { authClient } from '../../lib/auth-client'
import {
  getPasskeyManageErrorMessage,
  getPasskeyRegisterErrorMessage
} from '../../lib/passkey/messages'
import { isWebAuthnAvailable } from '../../lib/passkey/webauthn-support'
import { PasskeyListItem } from './list-item'
import type { ManagedPasskey } from './list-item'

const passkeySettingsHeading = css({
  marginBlockEnd: '3'
})

const passkeySettingsIntro = css({
  margin: '0',
  marginBlockEnd: '3',
  color: 'fg.muted',
  fontSize: 'sm'
})

const passkeySettingsToolbar = css({
  display: 'flex',
  marginBlockEnd: '3'
})

const passkeyEmpty = css({
  margin: '0',
  color: 'fg.muted',
  fontSize: 'sm'
})

const passkeyFeedback = css({
  marginBlockEnd: '3'
})

function toManagedPasskeys(value: unknown): ManagedPasskey[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.flatMap((item) => {
    if (item == null || typeof item !== 'object' || !('id' in item)) {
      return []
    }

    const record = item as {
      id?: unknown
      name?: unknown
      aaguid?: unknown
      createdAt?: unknown
    }

    if (typeof record.id !== 'string') {
      return []
    }

    const { createdAt } = record
    if (!(createdAt instanceof Date) && typeof createdAt !== 'string') {
      return []
    }

    return [
      {
        id: record.id,
        name: typeof record.name === 'string' ? record.name : null,
        aaguid: typeof record.aaguid === 'string' ? record.aaguid : null,
        createdAt
      }
    ]
  })
}

export function PasskeySettings() {
  const [webAuthnAvailable, setWebAuthnAvailable] = useState(false)
  const [passkeys, setPasskeys] = useState<ManagedPasskey[] | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  const loadPasskeys = async () => {
    const { data, error } = await authClient.passkey.listUserPasskeys()
    if (error != null) {
      setErrorMessage(getPasskeyManageErrorMessage(error))
      setPasskeys((current) => current ?? [])
      return
    }

    setPasskeys(toManagedPasskeys(data))
  }

  useEffect(() => {
    setWebAuthnAvailable(isWebAuthnAvailable())
    void loadPasskeys()
  }, [])

  const handleMutated = (message: string) => {
    setErrorMessage(null)
    setStatusMessage(message)
    void loadPasskeys()
  }

  const handleAdd = () => {
    setErrorMessage(null)
    setStatusMessage(null)
    setIsAdding(true)
    void (async () => {
      try {
        const { error } = await authClient.passkey.addPasskey()
        if (error != null) {
          const message = getPasskeyRegisterErrorMessage(error)
          if (message != null) {
            setErrorMessage(message)
          }
          return
        }
        setStatusMessage('パスキーを登録しました')
        await loadPasskeys()
      } catch {
        setErrorMessage(getPasskeyRegisterErrorMessage({}))
      } finally {
        setIsAdding(false)
      }
    })()
  }

  return (
    <>
      <h2 className={cx(sectionLabel, passkeySettingsHeading)}>パスキー</h2>
      <p className={passkeySettingsIntro}>
        登録したパスキーで、パスワードを入力せずにログインできます。
      </p>

      {errorMessage != null ? (
        <div
          className={cx(formSummary, passkeyFeedback)}
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

      {statusMessage != null ? (
        <output
          className={cx(flash, passkeyFeedback)}
          aria-live='polite'>
          {statusMessage}
        </output>
      ) : null}

      {webAuthnAvailable ? (
        <div className={passkeySettingsToolbar}>
          <StyledButton
            visual='accent'
            onPress={handleAdd}
            isDisabled={isAdding}>
            <KeyRound
              size={16}
              aria-hidden
            />{' '}
            {isAdding ? 'パスキーを登録中...' : 'パスキーを追加'}
          </StyledButton>
        </div>
      ) : null}

      {passkeys == null ? <p className={passkeyEmpty}>読み込み中...</p> : null}

      {passkeys != null && passkeys.length === 0 && errorMessage == null ? (
        <p className={passkeyEmpty}>パスキーはまだ登録されていません</p>
      ) : null}

      {passkeys != null && passkeys.length > 0 ? (
        <div>
          {passkeys.map((passkey) => (
            <PasskeyListItem
              key={passkey.id}
              passkey={passkey}
              onMutated={handleMutated}
            />
          ))}
        </div>
      ) : null}
    </>
  )
}
