import { ArrowLeft, LogOut } from 'lucide-react'
import { css, cx } from 'styled-system/css'

import { StyledButton } from '../../../shared/components/styled-button'
import { StyledLink } from '../../../shared/components/styled-link'
import { pageLead, pageTitle, sectionLabel } from '../../../styles/type'
import type { ensureSession } from '../../auth/functions/ensure-session'
import { useSignOut } from '../../auth/hooks/use-sign-out'
import { defaultBookmarkSearch } from '../../navigation/lib/bookmark-search'

const settings = css({
  maxInlineSize: '28rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '5'
})

const settingsHeading = css({
  marginBlockEnd: '3'
})

const settingsSection = css({
  borderBlockStartWidth: 'thin',
  borderBlockStartStyle: 'solid',
  borderBlockStartColor: 'border.default',
  paddingBlockStart: '5'
})

const settingsAccount = css({
  display: 'grid',
  gap: '3.5',
  margin: '0'
})

const settingsAccountRow = css({
  display: 'grid',
  gap: '1'
})

const settingsAccountDt = css({
  color: 'fg.muted',
  fontSize: 'xs2'
})

const settingsAccountDd = css({
  margin: '0',
  wordBreak: 'break-word'
})

interface SettingsScreenProps {
  readonly user: Awaited<ReturnType<typeof ensureSession>>['user']
}

export function SettingsScreen({ user }: SettingsScreenProps) {
  const { handleSignOut, isPending } = useSignOut()

  return (
    <div className={settings}>
      <h1 className={pageTitle}>設定</h1>
      <p className={pageLead}>アカウントと出口</p>

      <section className={settingsSection}>
        <h2 className={cx(sectionLabel, settingsHeading)}>アカウント</h2>
        <dl className={settingsAccount}>
          <div className={settingsAccountRow}>
            <dt className={settingsAccountDt}>名前</dt>
            <dd className={settingsAccountDd}>{user.name}</dd>
          </div>
          <div className={settingsAccountRow}>
            <dt className={settingsAccountDt}>メール</dt>
            <dd className={settingsAccountDd}>{user.email}</dd>
          </div>
        </dl>
      </section>

      <section className={settingsSection}>
        <h2 className={cx(sectionLabel, settingsHeading)}>セッション</h2>
        <StyledButton
          visual='accent'
          onPress={handleSignOut}
          isDisabled={isPending}>
          <LogOut
            size={16}
            aria-hidden
          />{' '}
          {isPending ? 'ログアウト中...' : 'ログアウト'}
        </StyledButton>
      </section>

      <StyledLink
        to='/'
        search={defaultBookmarkSearch}
        visual='accent'>
        <ArrowLeft
          size={16}
          aria-hidden
        />{' '}
        玄関へ戻る
      </StyledLink>
    </div>
  )
}
