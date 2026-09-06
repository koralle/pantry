import { css } from "styled-system/css";

import preview from "../../storybook/preview";
import { Catalog, Meta as TokenMeta, Section, tokenValue } from "./catalog";
import { customSizeTokens } from "./token-data";

function SizesCatalog() {
  return (
    <Catalog
      title="サイズ"
      description="panda.config.ts で extend した sizes。viewport / clamp / fit-content 系は値ラベル中心、長さ系は実寸ボックスで示します。"
    >
      <Section title="Project sizes">
        <div className={stack}>
          {customSizeTokens.map((entry) => {
            const value = tokenValue(entry);
            const isLengthLike =
              /rem|px|%|dvh|dvb|touch|fit|min\(|calc\(/i.test(value) ||
              /^\d/.test(entry.label);

            return (
              <article key={entry.path} className={row}>
                <div className={labelCol}>
                  <p className={label}>{entry.label}</p>
                  <TokenMeta path={entry.path} value={value} />
                </div>
                {isLengthLike &&
                !value.includes("dvh") &&
                !value.includes("dvb") ? (
                  <div className={track}>
                    <div className={box} style={{ inlineSize: value }} />
                  </div>
                ) : (
                  <p className={note}>動的 / 特殊値 - ラベルで確認</p>
                )}
              </article>
            );
          })}
        </div>
      </Section>
    </Catalog>
  );
}

const meta = preview.meta({
  parameters: { layout: "padded" },
  title: "Theme/サイズ",
});

export const CatalogStory = meta.story({
  name: "カタログ",
  render: () => <SizesCatalog />,
});

const stack = css({
  display: "flex",
  flexDirection: "column",
  gap: "3",
});

const row = css({
  alignItems: "center",
  display: "grid",
  gap: "4",
  gridTemplateColumns: "10rem minmax(0, 1fr)",
});

const labelCol = css({
  display: "flex",
  flexDirection: "column",
  gap: "1",
});

const label = css({
  fontFamily: "mono",
  fontSize: "sm",
  fontWeight: "semibold",
  margin: "0",
});

const track = css({
  maxInlineSize: "full",
  overflow: "auto",
  paddingBlock: "1",
});

const box = css({
  background: "accent.subtle",
  blockSize: "touch",
  borderColor: "border.accent",
  borderRadius: "box",
  borderStyle: "solid",
  borderWidth: "thin",
  maxInlineSize: "full",
  minInlineSize: "2",
});

const note = css({
  color: "fg.muted",
  fontSize: "xs",
  margin: "0",
});
