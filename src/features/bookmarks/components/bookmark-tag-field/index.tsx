import { Blank, ErrorState, Loading, Ready } from './views'

export type { CreateTag, CreateTagError, CreateTagResult, SelectableTag } from './types'

export const BookmarkTagField = {
  Loading,
  Error: ErrorState,
  Blank,
  Ready
}
