const MAX_BODY_BYTES = 1024 * 1024
const MAX_REDIRECTS = 3
const TIMEOUT_MS = 3000

const metadataIpv4Addresses = new Set(['100.100.100.200'])

export async function fetchPageTitle(value: string): Promise<string | null> {
  let url = validateUrl(value)
  const signal = AbortSignal.timeout(TIMEOUT_MS)

  for (let redirects = 0; ; redirects += 1) {
    let response: Response

    try {
      response = await fetch(url, { redirect: 'manual', signal })
    } catch {
      return null
    }

    if (isRedirect(response.status)) {
      const location = response.headers.get('location')
      await discardResponse(response)

      if (location == null) {
        return null
      }

      url = validateUrl(location, url)

      if (redirects >= MAX_REDIRECTS) {
        return null
      }

      continue
    }

    return titleFromResponse(response)
  }
}

function validateUrl(value: string, base?: URL): URL {
  let url: URL

  try {
    url = new URL(value, base)
  } catch {
    throw new Error('Invalid URL')
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Invalid URL')
  }

  const hostname = url.hostname.toLowerCase().replace(/\.+$/, '')

  if (hostname === 'localhost' || hostname.endsWith('.localhost') || isBlockedIpAddress(hostname)) {
    throw new Error('Invalid URL')
  }

  return url
}

function isBlockedIpAddress(hostname: string): boolean {
  const address = hostname.replace(/^\[|\]$/g, '')
  const ipv4 = parseIpv4(address)

  if (ipv4 != null) {
    return isBlockedIpv4(ipv4)
  }

  const ipv6 = parseIpv6(address)

  return ipv6 != null && isBlockedIpv6(ipv6)
}

function parseIpv4(value: string): number | null {
  const octets = value.split('.')

  if (octets.length !== 4) {
    return null
  }

  let address = 0

  for (const octet of octets) {
    if (!/^\d+$/.test(octet)) {
      return null
    }

    const parsed = Number(octet)

    if (parsed > 255) {
      return null
    }

    address = (address << 8) | parsed
  }

  return address >>> 0
}

function isBlockedIpv4(address: number): boolean {
  const first = address >>> 24
  const second = (address >>> 16) & 0xFF

  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    first >= 224 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 198 && (second === 18 || second === 19)) ||
    metadataIpv4Addresses.has(formatIpv4(address))
  )
}

function formatIpv4(address: number): string {
  return [address >>> 24, (address >>> 16) & 0xFF, (address >>> 8) & 0xFF, address & 0xFF].join('.')
}

function parseIpv6(value: string): bigint | null {
  const ipv4Index = value.lastIndexOf(':')
  const ipv4 = value.includes('.') ? parseIpv4(value.slice(ipv4Index + 1)) : null

  if (value.includes('.') && ipv4 == null) {
    return null
  }

  const normalized =
    ipv4 == null
      ? value
      : `${value.slice(0, ipv4Index)}${(ipv4 >>> 16).toString(16)}:${(ipv4 & 0xFFFF).toString(16)}`
  const doubleColonIndex = normalized.indexOf('::')

  if (doubleColonIndex !== normalized.lastIndexOf('::')) {
    return null
  }

  const left = doubleColonIndex === -1 ? normalized : normalized.slice(0, doubleColonIndex)
  const right = doubleColonIndex === -1 ? '' : normalized.slice(doubleColonIndex + 2)
  const leftParts = left === '' ? [] : left.split(':')
  const rightParts = right === '' ? [] : right.split(':')
  const missingParts = 8 - leftParts.length - rightParts.length

  if (
    (doubleColonIndex === -1 && missingParts !== 0) ||
    (doubleColonIndex !== -1 && missingParts < 1)
  ) {
    return null
  }

  const parts = [...leftParts, ...Array(missingParts).fill('0'), ...rightParts]

  if (parts.some((part) => !/^[\da-f]{1,4}$/i.test(part))) {
    return null
  }

  return parts.reduce((address, part) => (address << 16n) | BigInt(`0x${part}`), 0n)
}

function isBlockedIpv6(address: bigint): boolean {
  const ipv4 = Number(address & 0xFFFFFFFFn)
  const upper96Bits = address >> 32n

  return (
    address === 0n ||
    address === 1n ||
    address >> 121n === 0b111_1110n ||
    address >> 118n === 0b11_1111_1010n ||
    (upper96Bits === 0n && isBlockedIpv4(ipv4)) ||
    (upper96Bits === 0xFFFFn && isBlockedIpv4(ipv4))
  )
}

function isRedirect(status: number): boolean {
  return status === 301 || status === 302 || status === 303 || status === 307 || status === 308
}

async function titleFromResponse(response: Response): Promise<string | null> {
  if (
    isOversized(response.headers.get('content-length')) ||
    !isHtml(response.headers.get('content-type'))
  ) {
    await discardResponse(response)

    return null
  }

  const html = await readBody(response.body)

  return html == null ? null : parseTitle(html)
}

function isOversized(contentLength: string | null): boolean {
  if (contentLength == null || !/^\d+$/.test(contentLength)) {
    return false
  }

  return Number(contentLength) > MAX_BODY_BYTES
}

function isHtml(contentType: string | null): boolean {
  return contentType?.split(';')[0]?.trim().toLowerCase() === 'text/html'
}

async function discardResponse(response: Response): Promise<void> {
  try {
    await response.body?.cancel()
  } catch {
    // The response was already closed or canceled.
  }
}

async function readBody(body: ReadableStream<Uint8Array> | null): Promise<string | null> {
  if (body == null) {
    return null
  }

  const reader = body.getReader()
  const chunks: Uint8Array[] = []
  let totalBytes = 0

  try {
    for (;;) {
      const { done, value } = await reader.read()

      if (done) {
        break
      }

      totalBytes += value.byteLength

      if (totalBytes > MAX_BODY_BYTES) {
        await cancelReader(reader)

        return null
      }

      chunks.push(value)
    }
  } catch {
    await cancelReader(reader)

    return null
  } finally {
    reader.releaseLock()
  }

  const bytes = new Uint8Array(totalBytes)
  let offset = 0

  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }

  return new TextDecoder().decode(bytes)
}

async function cancelReader(reader: ReadableStreamDefaultReader<Uint8Array>): Promise<void> {
  try {
    await reader.cancel()
  } catch {
    // The stream is already closed or canceled.
  }
}

async function parseTitle(html: string): Promise<string | null> {
  let firstTitleSeen = false
  let collectingTitle = false
  let title = ''
  const rewriter = new HTMLRewriter().on('title', {
    element() {
      collectingTitle = !firstTitleSeen
      firstTitleSeen = true
    },
    text(text) {
      if (collectingTitle) {
        title += text.text
      }

      if (text.lastInTextNode) {
        collectingTitle = false
      }
    }
  })
  const {body} = rewriter.transform(new Response(html))

  if (body == null) {
    return null
  }

  try {
    await body.pipeTo(new WritableStream())
  } catch {
    return null
  }

  const trimmedTitle = title.trim()

  return trimmedTitle === '' ? null : trimmedTitle
}
