import { css } from "styled-system/css";

import preview from "../../storybook/preview";
import { Catalog, Meta as TokenMeta, Section, tokenValue } from "./catalog";
import { radiusTokens } from "./token-data";

function RadiiCatalog() {
  return (
    <Catalog
      title="角丸"
      description="radii トークン。box / sheet / full はプロジェクト拡張、その他は Panda デフォルトです。"
    >
      <Section title="Border radius">
        <div className={grid}>
          {radiusTokens.map((entry) => (
            <article key={entry.path} className={card}>
              <div
                className={sample}
                style={{ borderRadius: tokenValue(entry) }}
              />
              <p className={label}>{entry.label}</p>
              <TokenMeta path={entry.path} value={tokenValue(entry)} />
            </article>
          ))}
        </div>
      </Section>
    </Catalog>
  );
}

const meta = preview.meta({
  parameters: { layout: "padded" },
  title: "Theme/角丸",
});

export const CatalogStory = meta.story({
  name: "カタログ",
  render: () => <RadiiCatalog />,
});

const grid = css({
  display: "grid",
  gap: "4",
  gridTemplateColumns: "repeat(auto-fill, minmax(8rem, 1fr))",
});

const card = css({
  background: "bg.surface",
  borderColor: "border.default",
  borderRadius: "box",
  borderStyle: "solid",
  borderWidth: "thin",
  display: "flex",
  flexDirection: "column",
  gap: "2",
  padding: "3",
});

const sample = css({
  background: "accent.subtle",
  blockSize: "4.5rem",
  borderColor: "accent.solid",
  borderStyle: "solid",
  borderWidth: "medium",
  inlineSize: "full",
});

const label = css({
  fontFamily: "mono",
  fontSize: "sm",
  fontWeight: "semibold",
  margin: "0",
});
