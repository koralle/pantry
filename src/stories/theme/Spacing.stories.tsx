import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { css } from 'styled-system/css'

import { Catalog, Meta as TokenMeta, Section, tokenValue } from './catalog'
import { spacingTokens } from './token-data'

function SpacingCatalog() {
  return (
    <Catalog
      title='余白'
      description='Panda の spacing スケール（正の値）。プロジェクトは spacing を extend していないため、デフォルトトークンをそのまま可視化しています。'>
      <Section title='Spacing scale'>
        <div className={stack}>
          {spacingTokens.map((entry) => (
            <article
              key={entry.path}
              className={row}>
              <div className={labelCol}>
                <p className={label}>{entry.label}</p>
                <TokenMeta
                  path={entry.path}
                  value={tokenValue(entry)}
                />
              </div>
              <div
                className={bar}
                style={{ inlineSize: tokenValue(entry) }}
              />
            </article>
          ))}
        </div>
      </Section>
    </Catalog>
  )
}

const meta = {
  title: 'Theme/余白',
  parameters: { layout: 'padded' }
} satisfies Meta

export default meta
type Story = StoryObj

export const CatalogStory: Story = {
  name: 'カタログ',
  render: () => <SpacingCatalog />
}

const stack = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2'
})

const row = css({
  display: 'grid',
  gridTemplateColumns: '8rem minmax(0, 1fr)',
  gap: '4',
  alignItems: 'center'
})

const labelCol = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '1'
})

const label = css({
  margin: '0',
  fontSize: 'sm',
  fontWeight: 'semibold',
  fontFamily: 'mono'
})

const bar = css({
  blockSize: '3',
  minInlineSize: '0.5',
  maxInlineSize: 'full',
  borderRadius: 'box',
  background: 'accent.solid'
})
