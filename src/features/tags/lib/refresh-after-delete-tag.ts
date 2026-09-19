/**
 * DELETE の成功と loader の再取得は別の成功条件。
 * invalidate を mutation の Promise に繋ぐと、消したあとにダイアログが失敗表示へ戻る。
 */
export const refreshAfterDeleteTag = (router: {
  invalidate: () => Promise<unknown>;
}): void => {
  void router.invalidate().catch((error: unknown) => {
    console.error("Failed to refresh route data after DeleteTag", error);
  });
};
