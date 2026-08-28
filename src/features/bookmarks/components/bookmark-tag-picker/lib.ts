import * as v from 'valibot'

import { tagNameSchema, tagNamesMatch, toTagName } from '../../../tags/domain/tag-values'

export type NamedTag = {
  readonly id: number
  readonly name: string
}

export function filterTagCandidates<T extends { readonly name: string }>(
  sortedTags: readonly T[],
  query: string
): T[] {
  const needle = toTagName(query).normalized
  if (needle === '') {
    return [...sortedTags]
  }

  return sortedTags.filter((tag) => toTagName(tag.name).normalized.includes(needle))
}

export function canOfferCreateTag(input: {
  readonly query: string
  readonly tags: readonly { readonly name: string }[]
  readonly tagsReady: boolean
}): boolean {
  if (!input.tagsReady) {
    return false
  }

  const parsed = v.safeParse(tagNameSchema, input.query)
  if (!parsed.success) {
    return false
  }

  return !input.tags.some((tag) => tagNamesMatch(tag.name, input.query))
}

export function toggleSelectedTag(selected: readonly NamedTag[], tag: NamedTag): NamedTag[] {
  if (selected.some((item) => item.id === tag.id)) {
    return selected.filter((item) => item.id !== tag.id)
  }
  return [...selected, tag]
}

export function resolveCreateTagConflict(input: {
  readonly query: string
  readonly tags: readonly NamedTag[]
}): NamedTag | null {
  const match = input.tags.find((tag) => tagNamesMatch(tag.name, input.query))
  return match === undefined ? null : { id: match.id, name: match.name }
}
