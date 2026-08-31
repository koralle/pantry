const PASS_TIMEOUT_MS = 15_000
const PASS_INTERVALS_MS = [250, 500, 1000] as const
export const PASS_EXPECT_TIMEOUT_MS = 2000

export const passOptions: { timeout: number; intervals: number[] } = {
  timeout: PASS_TIMEOUT_MS,
  intervals: [...PASS_INTERVALS_MS]
}
