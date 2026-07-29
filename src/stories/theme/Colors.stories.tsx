import { css } from 'styled-system/css'

import preview from '../../storybook/preview'
import { Catalog, Meta as TokenMeta, Section, tokenValue } from './catalog'
import { pantryColors, semanticColors } from './token-data'

function ColorsCatalog() {
  return (
    <Catalog
      title='色'
      description='panda.config.ts の colors / semanticTokens.colors。スウォッチは実際の CSS 変数を参照しています。'>
      <Section title='Primitive（pantry）'>
        <div className={swatchGrid}>
          {pantryColors.map((entry) => (
            <article
              key={entry.path}
              className={swatchCard}>
              <div
                className={swatch}
                style={{ background: tokenValue(entry) }}
              />
              <div className={swatchBody}>
                <p className={swatchName}>{entry.label}</p>
                <TokenMeta
                  path={entry.path}
                  value={tokenValue(entry)}
                />
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section title='Semantic'>
        <div className={swatchGrid}>
          {semanticColors.map((entry) => (
            <article
              key={entry.path}
              className={swatchCard}>
              <div
                className={swatch}
                style={{ background: tokenValue(entry) }}
              />
              <div className={swatchBody}>
                <p className={swatchName}>{entry.label}</p>
                <TokenMeta
                  path={entry.path}
                  value={tokenValue(entry)}
                />
              </div>
            </article>
          ))}
        </div>
      </Section>
    </Catalog>
  )
}

const meta = preview.meta({
  title: 'Theme/色',
  parameters: { layout: 'padded' }
})

export const CatalogStory = meta.story({
  name: 'カタログ',
  render: () => <ColorsCatalog />
})

const swatchGrid = css({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(10rem, 1fr))',
  gap: '4'
})

const swatchCard = css({
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  borderWidth: 'thin',
  borderStyle: 'solid',
  borderColor: 'border.default',
  borderRadius: 'box',
  background: 'bg.surface'
})

const swatch = css({
  blockSize: '5.5rem',
  borderBlockEndWidth: 'thin',
  borderBlockEndStyle: 'solid',
  borderBlockEndColor: 'border.default'
})

const swatchBody = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2',
  padding: '3'
})

const swatchName = css({
  margin: '0',
  fontSize: 'sm',
  fontWeight: 'semibold'
})
