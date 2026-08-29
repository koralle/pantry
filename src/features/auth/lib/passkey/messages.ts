import { isPasskeyUserCancelled } from './error'

type PasskeyClientError = {
  readonly code?: string | undefined
  readonly status?: number | undefined
}

function isSessionProblem(error: PasskeyClientError): boolean {
  return (
    error.code === 'SESSION_REQUIRED' || error.code === 'SESSION_NOT_FRESH' || error.status === 401
  )
}

export function getPasskeySignInErrorMessage(error: PasskeyClientError): string | null {
  if (isPasskeyUserCancelled(error)) {
    return null
  }

  return 'パスキー認証に失敗しました。もう一度試すか、メールとパスワードでログインしてください'
}

export function getPasskeyRegisterErrorMessage(error: PasskeyClientError): string | null {
  if (isPasskeyUserCancelled(error)) {
    return null
  }

  if (
    error.code === 'PREVIOUSLY_REGISTERED' ||
    error.code === 'ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED'
  ) {
    return 'この認証器のパスキーはすでに登録されています'
  }

  if (isSessionProblem(error)) {
    return 'セッションの有効期限が切れました。再度ログインしてください'
  }

  return 'パスキーの登録に失敗しました'
}

export function getPasskeyManageErrorMessage(error: PasskeyClientError): string {
  if (isSessionProblem(error)) {
    return 'セッションの有効期限が切れました。再度ログインしてください'
  }

  return 'パスキーの操作に失敗しました'
}
