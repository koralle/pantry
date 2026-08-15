import { css } from 'styled-system/css'

import { StyledLink } from '../../../shared/components/styled-link'

const signUpPage = css({
  minBlockSize: '100dvh',
  display: 'grid',
  placeItems: 'center',
  paddingBlock: '6',
  paddingInline: '4',
  backgroundImage:
    'radial-gradient(ellipse at 20% 0%, color-mix(in oklab, {colors.pantry.accent} 10%, transparent), transparent 55%)',
  backgroundColor: 'bg.canvas'
})

const signUpPanel = css({
  width: '22rem',
  maxInlineSize: 'full',
  display: 'flex',
  flexDirection: 'column',
  gap: '4'
})

const signUpBrand = css({
  margin: '0',
  fontSize: '3xl',
  fontWeight: 'bold',
  letterSpacing: 'wide'
})

const signUpLead = css({
  margin: '0',
  color: 'fg.muted'
})

export function SignUpScreen() {
  return (
    <div className={signUpPage}>
      <div className={signUpPanel}>
        <p className={signUpBrand}>Pantry</p>
        <p className={signUpLead}>
          新規登録は受け付けていません。棚に入るにはサインインしてください。
        </p>
        <StyledLink
          to='/sign-in'
          visual='accent'>
          サインイン
        </StyledLink>
      </div>
    </div>
  )
}
