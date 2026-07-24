import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { css } from 'styled-system/css'

import { Catalog, Meta as TokenMeta, Section, tokenValue } from './catalog'
import { fontSizeTokens, fontTokens, fontWeightTokens, lineHeightTokens } from './token-data'

function TypographyCatalog() {
  return (
    <Catalog
      title='Typography'
      description='fonts / fontSizes / lineHeights / fontWeights。project 拡張トークンを優先し、よく使うデフォルトも含めます。'>
      <Section title='Font family'>
        <div className={stack}>
          {fontTokens.map((entry) => (
            <article
              key={entry.path}
              className={specimenCard}>
              <p
                className={fontSpecimen}
                style={{ fontFamily: tokenValue(entry) }}>
                Pantry のブックマークを、タグで棚に並べる。The quick brown fox.
              </p>
              <TokenMeta
                path={entry.path}
                value={tokenValue(entry)}
              />
            </article>
          ))}
        </div>
      </Section>

      <Section title='Font size'>
        <div className={stack}>
          {fontSizeTokens.map((entry) => (
            <article
              key={entry.path}
              className={specimenCard}>
              <p
                className={sizeSpecimen}
                style={{ fontSize: tokenValue(entry) }}>
                {entry.label} — あいうえお Aa Bb 123
              </p>
              <TokenMeta
                path={entry.path}
                value={tokenValue(entry)}
              />
            </article>
          ))}
        </div>
      </Section>

      <Section title='Line height'>
        <div className={stack}>
          {lineHeightTokens.map((entry) => (
            <article
              key={entry.path}
              className={specimenCard}>
              <p
                className={lineSpecimen}
                style={{ lineHeight: tokenValue(entry) }}>
                行間 {entry.label}
                。タグベースのブックマークマネージャ。長い文でも行のリズムが分かるように、二行以上のサンプルを置いています。
              </p>
              <TokenMeta
                path={entry.path}
                value={tokenValue(entry)}
              />
            </article>
          ))}
        </div>
      </Section>

      <Section title='Font weight'>
        <div className={stack}>
          {fontWeightTokens.map((entry) => (
            <article
              key={entry.path}
              className={specimenCard}>
              <p
                className={weightSpecimen}
                style={{ fontWeight: tokenValue(entry) }}>
                {entry.label} — Pantry
              </p>
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
  title: 'Theme/Typography',
  parameters: { layout: 'padded' }
} satisfies Meta

export default meta
type Story = StoryObj

export const CatalogStory: Story = {
  name: 'カタログ',
  render: () => <TypographyCatalog />
}

const stack = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '3'
})

const specimenCard = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2',
  padding: '4',
  borderWidth: 'thin',
  borderStyle: 'solid',
  borderColor: 'border.default',
  borderRadius: 'box',
  background: 'bg.surface'
})

const fontSpecimen = css({
  margin: '0',
  fontSize: 'md'
})

const sizeSpecimen = css({
  margin: '0',
  lineHeight: 'tight'
})

const lineSpecimen = css({
  margin: '0',
  fontSize: 'md',
  maxInlineSize: '36rem'
})

const weightSpecimen = css({
  margin: '0',
  fontSize: 'lg'
})
