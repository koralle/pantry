/**
 * UPDATE の成功と loader の再取得は別の成功条件。
 * invalidate を mutation の Promise に繋ぐと、書いたあとにフォームが失敗表示へ戻る。
 */
export function refreshAfterUpdateTag(router: { invalidate: () => Promise<unknown> }): void {
  void router.invalidate().catch((error: unknown) => {
    console.error('Failed to refresh route data after UpdateTag', error)
  })
}
