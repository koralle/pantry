import * as v from 'valibot'

export const tagIdSchema = v.pipe(v.number(), v.integer(), v.minValue(1), v.brand('TagId'))

export type TagId = v.InferOutput<typeof tagIdSchema>

export type TagName = {
  readonly display: string
  readonly normalized: string
}

export function toTagName(input: string): TagName {
  const display = input.trim().normalize('NFC')
  return {
    display,
    normalized: display.toLowerCase()
  }
}

export function uniqueNormalizedTagNames(inputs: readonly string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const input of inputs) {
    const { normalized } = toTagName(input)
    if (normalized !== '' && !seen.has(normalized)) {
      seen.add(normalized)
      result.push(normalized)
    }
  }
  return result
}

export function tagNamesMatch(left: string, right: string): boolean {
  return toTagName(left).normalized === toTagName(right).normalized
}

export const tagNameSchema = v.pipe(
  v.string('タグ名を入力してください'),
  v.transform(toTagName),
  v.check((name) => name.display !== '', 'タグ名を入力してください'),
  v.check((name) => name.display.length <= 32, 'タグ名は32文字以内で入力してください')
)
