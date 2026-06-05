import type { QueryOptions } from '@tanstack/react-query'
import { useSuspenseQuery } from '@tanstack/react-query'

import type { Tag } from '../../../entities/tag'

const fetchTags = (): Tag[] => [{ id: 1, name: 'むぎちゃ' }]

const tagQueryOptions = {
  queryFn: () => fetchTags(),
  queryKey: []
} satisfies QueryOptions<Tag[]>

const useTags = () => useSuspenseQuery(tagQueryOptions)

export { tagQueryOptions, useTags }
