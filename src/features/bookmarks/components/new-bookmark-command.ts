export type NewBookmarkValues = {
  readonly url: string
  readonly title: string
  readonly note: string | null
  readonly tagIds: readonly number[]
}

export function buildNewBookmarkCommand(values: NewBookmarkValues) {
  return {
    url: values.url,
    title: values.title,
    note: values.note,
    tags: [...values.tagIds]
  }
}
