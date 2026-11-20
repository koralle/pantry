import { describe, expect, test } from "vitest";

import { isReactDoctorRuleEnabled } from "./oxlint.config";

// ここが false に変わると、そのルールは静かに検査されなくなる。
// 減る方向の取り違えは pnpm check を緑のまま通すので、期待値を固定する。
describe(isReactDoctorRuleEnabled, () => {
  test("React と TanStack を使うこのアプリで効くルールは有効", () => {
    expect(isReactDoctorRuleEnabled("react-doctor/no-derived-state")).toBe(
      true
    );
    expect(
      isReactDoctorRuleEnabled(
        "react-doctor/no-focusable-content-in-aria-hidden"
      )
    ).toBe(true);
    expect(
      isReactDoctorRuleEnabled(
        "react-doctor/query-mutation-missing-invalidation"
      )
    ).toBe(true);
  });

  test("組み込み側が off にしている移植ルールは react-doctor 側で残す", () => {
    // react/only-export-components は Ultracite が off。ここで false にすると
    // 組み込みも react-doctor も沈黙し、どちらも検査しない穴になる。
    expect(
      isReactDoctorRuleEnabled("react-doctor/only-export-components")
    ).toBe(true);
  });

  test("入っていないライブラリ向けのルールは無効", () => {
    expect(isReactDoctorRuleEnabled("react-doctor/rn-no-raw-text")).toBe(false);
    expect(
      isReactDoctorRuleEnabled("react-doctor/zustand-no-fresh-selector-result")
    ).toBe(false);
    expect(
      isReactDoctorRuleEnabled("react-doctor/three-cap-device-pixel-ratio")
    ).toBe(false);
  });

  test("登録に無いキーは無効", () => {
    expect(isReactDoctorRuleEnabled("react-doctor/not-a-rule")).toBe(false);
  });
});
