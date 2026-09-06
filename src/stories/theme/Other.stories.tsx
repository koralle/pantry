import { css } from "styled-system/css";

import preview from "../../storybook/preview";
import { Catalog, Meta as TokenMeta, Section, tokenValue } from "./catalog";
import {
  animationStyleNames,
  aspectRatioTokens,
  borderWidthTokens,
  breakpointTokens,
  durationTokens,
  easingTokens,
  shadowTokens,
} from "./token-data";

function OtherTokensCatalog() {
  return (
    <Catalog
      title="その他"
      description="borderWidths / shadows / durations / easings / aspectRatios / breakpoints / animationStyles（panda.config.ts 拡張分を含む）。"
    >
      <Section title="Border widths">
        <div className={stack}>
          {borderWidthTokens.map((entry) => (
            <article key={entry.path} className={row}>
              <div
                className={borderSample}
                style={{ borderWidth: tokenValue(entry) }}
              />
              <div>
                <p className={label}>{entry.label}</p>
                <TokenMeta path={entry.path} value={tokenValue(entry)} />
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section title="Shadows">
        <div className={shadowGrid}>
          {shadowTokens.map((entry) => (
            <article key={entry.path} className={shadowCard}>
              <div
                className={shadowSample}
                style={{ boxShadow: tokenValue(entry) }}
              />
              <p className={label}>{entry.label}</p>
              <TokenMeta path={entry.path} value={tokenValue(entry)} />
            </article>
          ))}
        </div>
      </Section>

      <Section title="Durations">
        <div className={list}>
          {durationTokens.map((entry) => (
            <div key={entry.path} className={listItem}>
              <p className={label}>{entry.label}</p>
              <TokenMeta path={entry.path} value={tokenValue(entry)} />
            </div>
          ))}
        </div>
      </Section>

      <Section title="Easings">
        <div className={list}>
          {easingTokens.map((entry) => (
            <div key={entry.path} className={listItem}>
              <p className={label}>{entry.label}</p>
              <TokenMeta path={entry.path} value={tokenValue(entry)} />
            </div>
          ))}
        </div>
      </Section>

      <Section title="Aspect ratios">
        <div className={aspectGrid}>
          {aspectRatioTokens.map((entry) => (
            <article key={entry.path} className={aspectCard}>
              <div
                className={aspectSample}
                style={{ aspectRatio: tokenValue(entry) }}
              />
              <p className={label}>{entry.label}</p>
              <TokenMeta path={entry.path} value={tokenValue(entry)} />
            </article>
          ))}
        </div>
      </Section>

      <Section title="Breakpoints">
        <div className={list}>
          {breakpointTokens.map((entry) => (
            <div key={entry.path} className={listItem}>
              <p className={label}>{entry.label}</p>
              <TokenMeta path={entry.path} value={tokenValue(entry)} />
            </div>
          ))}
        </div>
      </Section>

      <Section title="Animation styles（config）">
        <div className={list}>
          {animationStyleNames.map((name) => (
            <div key={name} className={listItem}>
              <p className={label}>{name}</p>
              <p className={hint}>
                panda.config.ts の animationStyles.{name}（keyframe + duration
                トークン）
              </p>
            </div>
          ))}
        </div>
      </Section>
    </Catalog>
  );
}

const meta = preview.meta({
  parameters: { layout: "padded" },
  title: "Theme/その他",
});

export const CatalogStory = meta.story({
  name: "カタログ",
  render: () => <OtherTokensCatalog />,
});

const stack = css({
  display: "flex",
  flexDirection: "column",
  gap: "3",
});

const row = css({
  alignItems: "center",
  display: "flex",
  gap: "4",
});

const borderSample = css({
  background: "bg.surface",
  blockSize: "12",
  borderColor: "accent.solid",
  borderRadius: "box",
  borderStyle: "solid",
  flexShrink: "0",
  inlineSize: "5.5rem",
});

const shadowGrid = css({
  display: "grid",
  gap: "4",
  gridTemplateColumns: "repeat(auto-fill, minmax(10rem, 1fr))",
});

const shadowCard = css({
  background: "bg.canvas",
  borderRadius: "box",
  display: "flex",
  flexDirection: "column",
  gap: "3",
  padding: "4",
});

const shadowSample = css({
  background: "bg.surface",
  blockSize: "4rem",
  borderRadius: "box",
});

const list = css({
  display: "flex",
  flexDirection: "column",
  gap: "2",
});

const listItem = css({
  background: "bg.surface",
  borderColor: "border.default",
  borderRadius: "box",
  borderStyle: "solid",
  borderWidth: "thin",
  display: "flex",
  flexDirection: "column",
  gap: "1",
  padding: "3",
});

const aspectGrid = css({
  display: "grid",
  gap: "4",
  gridTemplateColumns: "repeat(auto-fill, minmax(8rem, 1fr))",
});

const aspectCard = css({
  display: "flex",
  flexDirection: "column",
  gap: "2",
});

const aspectSample = css({
  background: "accent.subtle",
  borderColor: "border.accent",
  borderRadius: "box",
  borderStyle: "solid",
  borderWidth: "thin",
  inlineSize: "full",
});

const label = css({
  fontFamily: "mono",
  fontSize: "sm",
  fontWeight: "semibold",
  margin: "0",
});

const hint = css({
  color: "fg.muted",
  fontSize: "2xs",
  margin: "0",
});
