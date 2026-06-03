import { AppError } from './error'

const BLOCKED_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '[::1]', '169.254.169.254'])

export async function fetchTitle(url: string): Promise<string | null> {
  try {
    const parsed = new URL(url)

    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
      throw new AppError(400, 'INVALID_INPUT', 'Cannot fetch from localhost')
    }

    if (BLOCKED_HOSTS.has(parsed.hostname)) {
      return null
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => {
      controller.abort()
    }, 3000)

    const response = await fetch(url, {
      headers: { 'User-Agent': 'Pantry/1.0' },
      redirect: 'follow',
      signal: controller.signal
    })

    clearTimeout(timeout)

    if (!response.ok) {
      return null
    }

    const text = await response.text()
    const match = /<title[^>]*>([^<]+)<\/title>/iu.exec(text)
    return match?.[1]?.trim() ?? null
  } catch {
    return null
  }
}
