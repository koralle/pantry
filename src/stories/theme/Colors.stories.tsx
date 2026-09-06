import { css } from "styled-system/css";

import preview from "../../storybook/preview";
import { Catalog, Meta as TokenMeta, Section, tokenValue } from "./catalog";
import { pantryColors, semanticColors } from "./token-data";

function ColorsCatalog() {
  return (
    <Catalog
      title="色"
      description="panda.config.ts の colors / semanticTokens.colors。スウォッチは実際の CSS 変数を参照しています。"
    >
      <Section title="Primitive（pantry）">
        <div className={swatchGrid}>
          {pantryColors.map((entry) => (
            <article key={entry.path} className={swatchCard}>
              <div
                className={swatch}
                style={{ background: tokenValue(entry) }}
              />
              <div className={swatchBody}>
                <p className={swatchName}>{entry.label}</p>
                <TokenMeta path={entry.path} value={tokenValue(entry)} />
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section title="Semantic">
        <div className={swatchGrid}>
          {semanticColors.map((entry) => (
            <article key={entry.path} className={swatchCard}>
              <div
                className={swatch}
                style={{ background: tokenValue(entry) }}
              />
              <div className={swatchBody}>
                <p className={swatchName}>{entry.label}</p>
                <TokenMeta path={entry.path} value={tokenValue(entry)} />
              </div>
            </article>
          ))}
        </div>
      </Section>
    </Catalog>
  );
}

const meta = preview.meta({
  parameters: { layout: "padded" },
  title: "Theme/色",
});

export const CatalogStory = meta.story({
  name: "カタログ",
  render: () => <ColorsCatalog />,
});

const swatchGrid = css({
  display: "grid",
  gap: "4",
  gridTemplateColumns: "repeat(auto-fill, minmax(10rem, 1fr))",
});

const swatchCard = css({
  background: "bg.surface",
  borderColor: "border.default",
  borderRadius: "box",
  borderStyle: "solid",
  borderWidth: "thin",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
});

const swatch = css({
  blockSize: "5.5rem",
  borderBlockEndColor: "border.default",
  borderBlockEndStyle: "solid",
  borderBlockEndWidth: "thin",
});

const swatchBody = css({
  display: "flex",
  flexDirection: "column",
  gap: "2",
  padding: "3",
});

const swatchName = css({
  fontSize: "sm",
  fontWeight: "semibold",
  margin: "0",
});
