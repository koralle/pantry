import { defineConfig } from "oxfmt";
import ultracite from "ultracite/oxfmt";

export const oxfmtConfig = defineConfig({
  ...ultracite,
  ignorePatterns: [
    ...(ultracite.ignorePatterns ?? []),
    // リポジトリ固有のパスはここに置かない（各リポジトリの oxfmt.config.ts 側で足す）。
    "**/.agents/**",
  ],
});
