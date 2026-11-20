/**
 * React Doctor のルールを外すファイルとルール。
 *
 * Oxlint（apps/web/oxlint.config.ts）と CLI（doctor.config.ts）の両方がこれを読む。
 * 2 か所に書くと片方だけ直して結果がずれるため、ここを正本にする。
 * パスはどちらのツールから見ても apps/web からの相対で一致する。
 */
export const reactDoctorExemptions: readonly {
  readonly files: readonly string[];
  readonly rules: readonly string[];
}[] = [
  {
    // renderToString で hook を描画し、描画中に戻り値を受け取るハーネス。
    // props のコールバックを描画中に呼ぶのは、DOM も effect も使わずに hook を
    // 検証するための意図的な手段なので、この 2 ファイルだけ除外する。
    files: [
      "src/features/auth/hooks/use-email-sign-in.test.tsx",
      "src/features/auth/hooks/use-passkey-sign-in.test.tsx",
    ],
    rules: ["react-doctor/no-prop-callback-in-render"],
  },
  {
    // QuickAddRound は 300 行超で分岐も多い。分割は別作業として切り出す。
    files: ["src/features/bookmarks/components/quick-add/index.tsx"],
    rules: [
      "react-doctor/no-giant-component",
      "react-doctor/no-high-complexity-react-function",
    ],
  },
];
