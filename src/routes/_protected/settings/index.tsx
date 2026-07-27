import { useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { ArrowLeft, LogOut } from 'lucide-react'
import { useTransition } from 'react'
import { css } from 'styled-system/css'

import { defaultBookmarkSearch } from '../-lib/bookmark-search-schema'
import { authClient } from '../../../features/auth/auth-client'
import { ensureSession } from '../../../features/auth/auth.function'
import { StyledButton } from '../../../shared/components/styled-button'
import { StyledLink } from '../../../shared/components/styled-link'

const settings = css({
  maxInlineSize: '28rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '6'
})

const settingsTitle = css({
  margin: '0',
  fontSize: 'lg',
  fontWeight: 'bold'
})

const settingsLead = css({
  margin: '0',
  color: 'fg.muted'
})

const settingsHeading = css({
  margin: '0',
  color: 'fg.muted',
  fontSize: 'xs',
  fontWeight: 'semibold',
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

export const Route = createFileRoute('/_protected/settings/')({
  loader: async () => {
    const { user } = await ensureSession()
    return { user }
  },
  component: RouteComponent
})

function RouteComponent() {
  const { user } = Route.useLoaderData()
  const queryClient = useQueryClient()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleSignOut = () => {
    startTransition(async () => {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            queryClient.clear()
          }
        }
      })

      startTransition(async () => {
        await router.navigate({ to: '/sign-in' })
      })
    })
  }

  return (
    <div className={settings}>
      <h1 className={settingsTitle}>設定</h1>
      <p className={settingsLead}>アカウントと出口</p>

      <section className={settingsSection}>
        <h2 className={settingsHeading}>アカウント</h2>
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
        <h2 className={settingsHeading}>セッション</h2>
        <StyledButton
          visual='accent'
          onClick={handleSignOut}
          disabled={isPending}>
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
