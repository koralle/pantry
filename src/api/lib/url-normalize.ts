import { AppError } from './error'

export function normalizeUrl(raw: string): string {
  const trimmed = raw.trim()

  let url: URL
  try {
    url = new URL(trimmed)
  } catch {
    throw new AppError(400, 'INVALID_INPUT', 'Invalid URL format')
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new AppError(400, 'INVALID_INPUT', 'Only http and https URLs are allowed')
  }

  url.protocol = url.protocol.toLowerCase()
  url.hostname = url.hostname.toLowerCase()

  if (
    (url.protocol === 'http:' && url.port === '80') ||
    (url.protocol === 'https:' && url.port === '443')
  ) {
    url.port = ''
  }

  url.hash = ''

  const path = url.pathname
  if (path !== '/' && path.endsWith('/')) {
    url.pathname = path.slice(0, -1)
  }

  return url.toString()
}
