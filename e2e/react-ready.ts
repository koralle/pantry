import type { Locator } from '@playwright/test'

import { expect } from './fixtures'

function hasReactFiber(element: Element): boolean {
  return Object.keys(element).some((key) => key.startsWith('__reactFiber'))
}

/**
 * SSR の可視状態ではなく、対象ノードが React に hydrate されたことを待つ。
 * fill / click を再実行しない。
 */
export async function waitForReactReady(locator: Locator): Promise<void> {
  await expect
    .poll(async () => locator.evaluate(hasReactFiber), {
      message: 'React fiber on locator (hydrated)'
    })
    .toBe(true)
}
