export type NewBookmarkValues = {
  readonly url: string
  readonly title: string
  readonly note: string | null
}

export function buildNewBookmarkCommand(values: NewBookmarkValues) {
  return {
    ...values,
    tags: [] as number[]
  }
}
