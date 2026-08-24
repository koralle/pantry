import type { FetchPageTitleOutput } from '../application/fetch-page-title'

const MAX_REDIRECTS = 3
const MAX_RESPONSE_BYTES = 1_000_000
const TIMEOUT_MS = 3000

type FetchLike = typeof fetch

/**
 * 禁止 URL は例外ではなく `url-not-allowed` の戻り値として届ける。
 * redirect 先の検証も同じ関数に通し、private host への hop を塞ぐ。
 * hostname は WHATWG URL 正規化後（IPv6 は hex 展開・小文字）を前提とするが、
 * 生の `::ffff:127.0.0.1` 表記も受けるよう parser 側で吸収する。
 */
function parseAllowedPageUrl(rawUrl: string): URL | undefined {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    return undefined
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return undefined
  }

  const hostname = url.hostname.toLowerCase()
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname === 'metadata.google.internal' ||
    isBlockedIp(hostname)
  ) {
    return undefined
  }

  return url
}

function isBlockedIpv4Range(a: number, b: number): boolean {
  if (a === 10 || a === 127 || a === 0) {
    return true
  }
  if (a === 169 && b === 254) {
    return true
  }
  if (a === 172 && b >= 16 && b <= 31) {
    return true
  }
  if (a === 192 && b === 168) {
    return true
  }
  if (a === 100 && b >= 64 && b <= 127) {
    return true
  }

  return false
}

/**
 * IPv6 を 8 つの hextet に展開する。`::` 圧縮と末尾ドット形式（::ffff:1.2.3.4）も受け付ける。
 * 不正な表記は undefined。
 */
function parseIpv6Hextets(hostname: string): number[] | undefined {
  const parts = hostname.split('::')
  if (parts.length > 2) {
    return undefined
  }
  const compressed = parts.length === 2
  const [headSection = '', tailSection = ''] = parts

  const headTokens = headSection === '' ? [] : headSection.split(':')
  const tailTokens = compressed && tailSection !== '' ? tailSection.split(':') : []
  const tokens = [...headTokens, ...tailTokens]
  const lastTokenIndex = tokens.length - 1

  const hextets: number[] = []
  for (const [index, token] of tokens.entries()) {
    if (token.includes('.')) {
      const ipv4 = token.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
      if (ipv4 == null || index !== lastTokenIndex) {
        return undefined
      }
      const octets = ipv4.slice(1).map(Number)
      if (octets.some((octet) => octet > 255)) {
        return undefined
      }
      const [o0 = 0, o1 = 0, o2 = 0, o3 = 0] = octets
      hextets.push((o0 << 8) | o1, (o2 << 8) | o3)
      continue
    }

    if (!/^[0-9a-f]{1,4}$/.test(token)) {
      return undefined
    }
    hextets.push(Number.parseInt(token, 16))
  }

  if (hextets.length > 8 || (!compressed && hextets.length !== 8)) {
    return undefined
  }
  if (compressed) {
    hextets.splice(headTokens.length, 0, ...Array.from({ length: 8 - hextets.length }, () => 0))
  }

  return hextets
}
function isBlockedIp(rawHostname: string): boolean {
  // Workerd の URL.hostname は IPv6 の角括弧を残す（Node / WHATWG は剥がす）ため、ここで正規化する。
  const hostname =
    rawHostname.startsWith('[') && rawHostname.endsWith(']')
      ? rawHostname.slice(1, -1)
      : rawHostname

  const ipv4 = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (ipv4 != null) {
    const parts = ipv4.slice(1).map(Number)
    if (parts.some((part) => part > 255)) {
      return true
    }
    const [a, b] = parts as [number, number, number, number]
    return isBlockedIpv4Range(a, b)
  }

  const hextets = parseIpv6Hextets(hostname)
  if (hextets == null || hextets.length !== 8) {
    return false
  }

  const [g0 = 0, g1 = 0, g2 = 0, g3 = 0, g4 = 0, g5 = 0, g6 = 0] = hextets
  // Fc00::/7 unique local、fe80::/10 link-local
  if ((g0 & 0xFE00) === 0xfc_00 || (g0 & 0xFFC0) === 0xFE80) {
    return true
  }

  // 先頭 96bit がゼロ（::1、未指定 ::、廃止済み IPv4-compatible）または
  // IPv4-mapped（::ffff:0:0/96）なら、下位 32bit を IPv4 として再検査する。
  // ::ffff:127.0.0.1 は URL 正規化で ::ffff:7f00:1 になるため hex 形式での判定が必須。
  if (g0 === 0 && g1 === 0 && g2 === 0 && g3 === 0 && g4 === 0 && (g5 === 0 || g5 === 0xFFFF)) {
    return isBlockedIpv4Range(g6 >> 8, g6 & 0xFF)
  }

  return false
}

function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  if (match?.[1] == null) {
    return null
  }
  const title = match[1].replace(/\s+/g, ' ').trim()
  return title === '' ? null : title
}

async function readBodyLimited(response: Response, limit: number): Promise<string> {
  const contentLength = response.headers.get('content-length')
  if (contentLength != null && Number(contentLength) > limit) {
    return ''
  }

  if (response.body == null) {
    const text = await response.text()
    return text.slice(0, limit)
  }

  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }
    if (value == null) {
      continue
    }
    total += value.byteLength
    if (total > limit) {
      chunks.push(value.slice(0, value.byteLength - (total - limit)))
      break
    }
    chunks.push(value)
  }

  const merged = new Uint8Array(Math.min(total, limit))
  let offset = 0
  for (const chunk of chunks) {
    merged.set(chunk, offset)
    offset += chunk.byteLength
  }
  return new TextDecoder('utf-8', { fatal: false }).decode(merged)
}

/**
 * 取得不能・title なし・対応外 content type は手入力で継続できるよう
 * `unavailable` 成功に載せる。ここでは未知障害を throw しない。
 * network error も取得できなかったという事実でしかないためである。
 */
export async function fetchPageTitle(
  rawUrl: string,
  fetchImpl: FetchLike = fetch
): Promise<FetchPageTitleOutput> {
  const firstUrl = parseAllowedPageUrl(rawUrl)
  if (firstUrl === undefined) {
    return { kind: 'url-not-allowed' }
  }

  let currentUrl = firstUrl

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    const controller = new AbortController()
    const timeout = setTimeout(() => {
      controller.abort()
    }, TIMEOUT_MS)

    try {
      const response = await fetchImpl(currentUrl, {
        method: 'GET',
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          accept: 'text/html,application/xhtml+xml'
        }
      })

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location')
        if (location == null || redirectCount === MAX_REDIRECTS) {
          return { kind: 'unavailable' }
        }
        const nextUrl = parseAllowedPageUrl(new URL(location, currentUrl).toString())
        if (nextUrl === undefined) {
          return { kind: 'url-not-allowed' }
        }
        currentUrl = nextUrl
        continue
      }

      if (!response.ok) {
        return { kind: 'unavailable' }
      }

      const contentType = response.headers.get('content-type') ?? ''
      if (!contentType.includes('html') && !contentType.includes('xhtml')) {
        // Some sites omit content-type; still try to parse small bodies.
        if (contentType !== '') {
          return { kind: 'unavailable' }
        }
      }

      const body = await readBodyLimited(response, MAX_RESPONSE_BYTES)
      if (body === '') {
        return { kind: 'unavailable' }
      }
      const title = extractTitle(body)
      if (title === null) {
        return { kind: 'unavailable' }
      }
      return { kind: 'fetched', title }
    } catch {
      return { kind: 'unavailable' }
    } finally {
      clearTimeout(timeout)
    }
  }

  return { kind: 'unavailable' }
}
