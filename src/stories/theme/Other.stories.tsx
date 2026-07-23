import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { css } from 'styled-system/css'

import { Catalog, Meta as TokenMeta, Section, tokenValue } from './catalog'
import {
  animationStyleNames,
  aspectRatioTokens,
  borderWidthTokens,
  breakpointTokens,
  durationTokens,
  easingTokens,
  shadowTokens
} from './token-data'

function OtherTokensCatalog() {
  return (
    <Catalog
      title='その他'
      description='borderWidths / shadows / durations / easings / aspectRatios / breakpoints / animationStyles（panda.config.ts 拡張分を含む）。'>
      <Section title='Border widths'>
        <div className={stack}>
          {borderWidthTokens.map((entry) => (
            <article
              key={entry.path}
              className={row}>
              <div
                className={borderSample}
                style={{ borderWidth: tokenValue(entry) }}
              />
              <div>
                <p className={label}>{entry.label}</p>
                <TokenMeta
                  path={entry.path}
                  value={tokenValue(entry)}
                />
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section title='Shadows'>
        <div className={shadowGrid}>
          {shadowTokens.map((entry) => (
            <article
              key={entry.path}
              className={shadowCard}>
              <div
                className={shadowSample}
                style={{ boxShadow: tokenValue(entry) }}
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

      <Section title='Durations'>
        <div className={list}>
          {durationTokens.map((entry) => (
            <div
              key={entry.path}
              className={listItem}>
              <p className={label}>{entry.label}</p>
              <TokenMeta
                path={entry.path}
                value={tokenValue(entry)}
              />
            </div>
          ))}
        </div>
      </Section>

      <Section title='Easings'>
        <div className={list}>
          {easingTokens.map((entry) => (
            <div
              key={entry.path}
              className={listItem}>
              <p className={label}>{entry.label}</p>
              <TokenMeta
                path={entry.path}
                value={tokenValue(entry)}
              />
            </div>
          ))}
        </div>
      </Section>

      <Section title='Aspect ratios'>
        <div className={aspectGrid}>
          {aspectRatioTokens.map((entry) => (
            <article
              key={entry.path}
              className={aspectCard}>
              <div
                className={aspectSample}
                style={{ aspectRatio: tokenValue(entry) }}
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

      <Section title='Breakpoints'>
        <div className={list}>
          {breakpointTokens.map((entry) => (
            <div
              key={entry.path}
              className={listItem}>
              <p className={label}>{entry.label}</p>
              <TokenMeta
                path={entry.path}
                value={tokenValue(entry)}
              />
            </div>
          ))}
        </div>
      </Section>

      <Section title='Animation styles（config）'>
        <div className={list}>
          {animationStyleNames.map((name) => (
            <div
              key={name}
              className={listItem}>
              <p className={label}>{name}</p>
              <p className={hint}>
                panda.config.ts の animationStyles.{name}（keyframe + duration トークン）
              </p>
            </div>
          ))}
        </div>
      </Section>
    </Catalog>
  )
}

const meta = {
  title: 'Theme/その他',
  parameters: { layout: 'padded' }
} satisfies Meta

export default meta
type Story = StoryObj

export const CatalogStory: Story = {
  name: 'カタログ',
  render: () => <OtherTokensCatalog />
}

const stack = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '3'
})

const row = css({
  display: 'flex',
  alignItems: 'center',
  gap: '4'
})

const borderSample = css({
  inlineSize: '5.5rem',
  blockSize: '12',
  borderStyle: 'solid',
  borderColor: 'accent.solid',
  borderRadius: 'box',
  background: 'bg.surface',
  flexShrink: '0'
})

const shadowGrid = css({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(10rem, 1fr))',
  gap: '4'
})

const shadowCard = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '3',
  padding: '4',
  background: 'bg.canvas',
  borderRadius: 'box'
})

const shadowSample = css({
  blockSize: '4rem',
  borderRadius: 'box',
  background: 'bg.surface'
})

const list = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2'
})

const listItem = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '1',
  padding: '3',
  borderWidth: 'thin',
  borderStyle: 'solid',
  borderColor: 'border.default',
  borderRadius: 'box',
  background: 'bg.surface'
})

const aspectGrid = css({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(8rem, 1fr))',
  gap: '4'
})

const aspectCard = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2'
})

const aspectSample = css({
  inlineSize: 'full',
  background: 'accent.subtle',
  borderWidth: 'thin',
  borderStyle: 'solid',
  borderColor: 'border.accent',
  borderRadius: 'box'
})

const label = css({
  margin: '0',
  fontSize: 'sm',
  fontWeight: 'semibold',
  fontFamily: 'mono'
})

const hint = css({
  margin: '0',
  fontSize: '2xs',
  color: 'fg.muted'
})
