import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { css } from 'styled-system/css'

import { Catalog, Meta as TokenMeta, Section, tokenValue } from './catalog'
import { radiusTokens } from './token-data'

function RadiiCatalog() {
  return (
    <Catalog
      title='角丸'
      description='radii トークン。box / sheet / full はプロジェクト拡張、その他は Panda デフォルトです。'>
      <Section title='Border radius'>
        <div className={grid}>
          {radiusTokens.map((entry) => (
            <article
              key={entry.path}
              className={card}>
              <div
                className={sample}
                style={{ borderRadius: tokenValue(entry) }}
              />
              <p className={label}>{entry.label}</p>
              <TokenMeta
                path={entry.path}
                value={tokenValue(entry)}
              />
            </article>
          ))}
        </div>
      </Section>
    </Catalog>
  )
}

const meta = {
  title: 'Theme/角丸',
  parameters: { layout: 'padded' }
} satisfies Meta

export default meta
type Story = StoryObj

export const CatalogStory: Story = {
  name: 'カタログ',
  render: () => <RadiiCatalog />
}

const grid = css({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(8rem, 1fr))',
  gap: '4'
})

const card = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2',
  padding: '3',
  borderWidth: 'thin',
  borderStyle: 'solid',
  borderColor: 'border.default',
  borderRadius: 'box',
  background: 'bg.surface'
})

const sample = css({
  blockSize: '4.5rem',
  inlineSize: 'full',
  background: 'accent.subtle',
  borderWidth: 'medium',
  borderStyle: 'solid',
  borderColor: 'accent.solid'
})

const label = css({
  margin: '0',
  fontSize: 'sm',
  fontWeight: 'semibold',
  fontFamily: 'mono'
})
