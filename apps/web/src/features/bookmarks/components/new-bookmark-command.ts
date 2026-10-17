export interface NewBookmarkValues {
  readonly url: string;
  readonly title: string;
  readonly note: string | null;
  readonly tagIds: readonly number[];
}

export const buildNewBookmarkCommand = (values: NewBookmarkValues) => ({
  note: values.note,
  tags: [...values.tagIds],
  title: values.title,
  url: values.url,
});
