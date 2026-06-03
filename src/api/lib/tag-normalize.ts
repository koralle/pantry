import { AppError } from './error'

export function normalizeTags(tags: string[] | undefined): string[] {
  if (!tags || tags.length === 0) {
    return []
  }

  const seen = new Set<string>()
  const result: string[] = []

  for (const raw of tags) {
    const trimmed = raw.trim()
    if (trimmed.length === 0) {
      throw new AppError(400, 'INVALID_INPUT', 'Tag cannot be empty after trim')
    }
    if (trimmed.length > 32) {
      throw new AppError(400, 'INVALID_INPUT', 'Tag exceeds 32 characters')
    }
    const normalized = trimmed.toLowerCase()
    if (!seen.has(normalized)) {
      seen.add(normalized)
      result.push(normalized)
    }
  }

  if (result.length > 20) {
    throw new AppError(400, 'INVALID_INPUT', 'Maximum 20 tags allowed')
  }

  return result
}
