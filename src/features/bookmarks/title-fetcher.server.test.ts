import { afterEach, describe, expect, test, vi } from 'vitest'

import { fetchPageTitle } from './title-fetcher.server'

const maxBodyBytes = 1_000_000
const maxTitleBytes = 65_536

async function resolvePublicHostname(): Promise<string[]> {
  return ['93.184.216.34']
}

function fetchTitle(url: string) {
  return fetchPageTitle(url, resolvePublicHostname)
}

function htmlDocumentOfSize(size: number): string {
  const title = '<title>Pantry</title>'

  return title + ' '.repeat(size - title.length)
}

function expectFetchRequest(fetch: ReturnType<typeof vi.fn>, index: number, url: string) {
  const call = fetch.mock.calls[index]
  const input = call?.[0]
  const init = call?.[1] as RequestInit | undefined

  expect(input == null ? null : String(input)).toBe(url)
  expect(init).toMatchObject({ redirect: 'manual' })
  expect(init?.signal).toBeDefined()
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('fetchPageTitle', () => {
  test('returns a trimmed title from an HTML response', async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response('<html><head><title>  Pantry  </title></head></html>', {
        headers: { 'content-type': 'text/html; charset=utf-8' }
      })
    )
    vi.stubGlobal('fetch', fetch)

    await expect(fetchTitle('https://example.com')).resolves.toBe('Pantry')
    expectFetchRequest(fetch, 0, 'https://example.com/')
  })

  test('rejects a hostname that resolves to a private address', async () => {
    const resolveHostname = vi.fn().mockResolvedValue(['127.0.0.1'])
    const fetch = vi
      .fn()
      .mockResolvedValue(
        new Response('<title>Private</title>', { headers: { 'content-type': 'text/html' } })
      )
    vi.stubGlobal('fetch', fetch)

    await expect(fetchPageTitle('https://127.0.0.1.nip.io', resolveHostname)).resolves.toBeNull()
    expect(resolveHostname).toHaveBeenCalledWith('127.0.0.1.nip.io', expect.anything())
    expect(fetch).not.toHaveBeenCalled()
  })

  test.each(['fec0::1', '64:ff9b:1::1'])(
    'rejects a hostname that resolves to the non-global IPv6 address %s',
    async (address) => {
      const resolveHostname = vi.fn().mockResolvedValue([address])
      const fetch = vi
        .fn()
        .mockResolvedValue(
          new Response('<title>Private</title>', { headers: { 'content-type': 'text/html' } })
        )
      vi.stubGlobal('fetch', fetch)

      await expect(fetchPageTitle('https://example.com', resolveHostname)).resolves.toBeNull()
      expect(fetch).not.toHaveBeenCalled()
    }
  )

  test.each([
    ['2001:db8::1', 'AAAA', 28],
    ['3fff::1', 'AAAA', 28],
    ['2001:2::1', 'AAAA', 28],
    ['5f00::1', 'AAAA', 28],
    ['64:ff9b::a9fe:a9fe', 'AAAA', 28],
    ['2002:a9fe:a9fe::1', 'AAAA', 28],
    ['2001:0::5601:5601', 'AAAA', 28],
    ['192.0.0.3', 'A', 1],
    ['192.0.0.8', 'A', 1]
  ])(
    'rejects the special-use %s address returned by DoH',
    async (address, queryType, recordType) => {
      const fetch = vi.fn((input: RequestInfo | URL) => {
        const url = new URL(String(input))

        if (url.hostname === 'cloudflare-dns.com') {
          return new Response(
            JSON.stringify({
              Answer:
                url.searchParams.get('type') === queryType
                  ? [{ data: address, type: recordType }]
                  : []
            })
          )
        }

        return new Response('<title>Special-use</title>', {
          headers: { 'content-type': 'text/html' }
        })
      })
      vi.stubGlobal('fetch', fetch)

      await expect(fetchPageTitle('https://example.com')).resolves.toBeNull()
      expect(fetch.mock.calls.map(([input]) => String(input))).not.toContain('https://example.com/')
    }
  )

  test('accepts a hostname that resolves to a global-unicast IPv6 address', async () => {
    const resolveHostname = vi.fn().mockResolvedValue(['2606:4700:4700::1111'])
    const fetch = vi
      .fn()
      .mockResolvedValue(
        new Response('<title>Public</title>', { headers: { 'content-type': 'text/html' } })
      )
    vi.stubGlobal('fetch', fetch)

    await expect(fetchPageTitle('https://example.com', resolveHostname)).resolves.toBe('Public')
    expect(fetch).toHaveBeenCalledOnce()
  })

  test('returns null when DNS does not establish a public address', async () => {
    const resolveHostname = vi.fn().mockResolvedValue([])
    const fetch = vi
      .fn()
      .mockResolvedValue(
        new Response('<title>Unknown</title>', { headers: { 'content-type': 'text/html' } })
      )
    vi.stubGlobal('fetch', fetch)

    await expect(fetchPageTitle('https://example.com', resolveHostname)).resolves.toBeNull()
    expect(fetch).not.toHaveBeenCalled()
  })

  test('rejects a hostname when any resolved address is reserved', async () => {
    const resolveHostname = vi.fn().mockResolvedValue(['93.184.216.34', '192.0.2.1'])
    const fetch = vi
      .fn()
      .mockResolvedValue(
        new Response('<title>Reserved</title>', { headers: { 'content-type': 'text/html' } })
      )
    vi.stubGlobal('fetch', fetch)

    await expect(fetchPageTitle('https://example.com', resolveHostname)).resolves.toBeNull()
    expect(fetch).not.toHaveBeenCalled()
  })

  test('resolves A and AAAA records with DNS over HTTPS', async () => {
    const fetch = vi.fn((input: RequestInfo | URL) => {
      const url = new URL(String(input))

      if (url.hostname === 'cloudflare-dns.com') {
        return new Response(
          JSON.stringify({
            Answer: url.searchParams.get('type') === 'A' ? [{ data: '93.184.216.34', type: 1 }] : []
          })
        )
      }

      return new Response('<title>Pantry</title>', { headers: { 'content-type': 'text/html' } })
    })
    vi.stubGlobal('fetch', fetch)

    await expect(fetchPageTitle('https://example.com')).resolves.toBe('Pantry')
    expect(
      fetch.mock.calls
        .map(([input]) => String(input))
        .filter((url) => url.startsWith('https://cloudflare-dns.com/dns-query'))
    ).toStrictEqual([
      'https://cloudflare-dns.com/dns-query?name=example.com&type=A',
      'https://cloudflare-dns.com/dns-query?name=example.com&type=AAAA'
    ])
  })

  test('uses a three-second timeout for the complete fetch operation', async () => {
    const timeout = vi.spyOn(AbortSignal, 'timeout')
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response('<title>Pantry</title>', { headers: { 'content-type': 'text/html' } })
        )
    )

    await fetchTitle('https://example.com')

    expect(timeout).toHaveBeenCalledWith(3000)
  })

  test('revalidates each manual redirect before fetching it', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(null, {
          status: 302,
          headers: { location: '/destination' }
        })
      )
      .mockResolvedValueOnce(
        new Response('<title>Destination</title>', {
          headers: { 'content-type': 'text/html' }
        })
      )
    vi.stubGlobal('fetch', fetch)

    const resolveHostname = vi.fn().mockResolvedValue(['93.184.216.34'])

    await expect(fetchPageTitle('https://example.com/origin', resolveHostname)).resolves.toBe(
      'Destination'
    )
    expectFetchRequest(fetch, 0, 'https://example.com/origin')
    expectFetchRequest(fetch, 1, 'https://example.com/destination')
    expect(resolveHostname).toHaveBeenCalledTimes(2)
  })

  test('rejects a redirect to an invalid address without fetching it', async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response(null, {
        status: 302,
        headers: { location: 'http://127.0.0.1/private' }
      })
    )
    vi.stubGlobal('fetch', fetch)

    await expect(fetchTitle('https://example.com')).rejects.toThrow('Invalid URL')
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  test('stops after three redirects', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 302, headers: { location: '/one' } }))
      .mockResolvedValueOnce(new Response(null, { status: 302, headers: { location: '/two' } }))
      .mockResolvedValueOnce(new Response(null, { status: 302, headers: { location: '/three' } }))
      .mockResolvedValueOnce(new Response(null, { status: 302, headers: { location: '/four' } }))
    vi.stubGlobal('fetch', fetch)

    await expect(fetchTitle('https://example.com')).resolves.toBeNull()
    expect(fetch).toHaveBeenCalledTimes(4)
  })

  test.each([
    'not a URL',
    'ftp://example.com',
    'http://localhost',
    'http://localhost.',
    'http://subdomain.localhost',
    'http://127.0.0.1',
    'http://10.0.0.1',
    'http://172.16.0.1',
    'http://192.168.0.1',
    'http://192.0.2.1',
    'http://169.254.1.1',
    'http://198.51.100.1',
    'http://203.0.113.1',
    'http://100.100.100.200',
    'http://192.0.0.3',
    'http://192.0.0.8',
    'http://[::1]',
    'http://[2001:db8::1]',
    'http://[3fff::1]',
    'http://[2001:2::1]',
    'http://[5f00::1]',
    'http://[64:ff9b::a9fe:a9fe]',
    'http://[2002:a9fe:a9fe::1]',
    'http://[2001:0::5601:5601]',
    'http://[fc00::1]',
    'http://[fe80::1]',
    'http://[fec0::1]',
    'http://[64:ff9b:1::1]',
    'http://[::ffff:127.0.0.1]',
    'http://[ff00::1]'
  ])('throws a validation error for %s', async (url) => {
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)

    await expect(fetchTitle(url)).rejects.toThrow('Invalid URL')
    expect(fetch).not.toHaveBeenCalled()
  })

  test('returns null for a network or timeout failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('Timed out', 'TimeoutError')))

    await expect(fetchTitle('https://example.com')).resolves.toBeNull()
  })

  test('returns null without parsing a non-HTML response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('<title>Not HTML</title>', {
          headers: { 'content-type': 'application/json' }
        })
      )
    )

    await expect(fetchTitle('https://example.com')).resolves.toBeNull()
  })

  test('returns null when an HTML response has no title', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('<html><head></head><body>Pantry</body></html>', {
          headers: { 'content-type': 'text/html' }
        })
      )
    )

    await expect(fetchTitle('https://example.com')).resolves.toBeNull()
  })

  test('does not parse a title that starts after 65,536 bytes', async () => {
    const prefix = '<html><head>'
    const html = `${prefix}${' '.repeat(maxTitleBytes - prefix.length + 1)}<title>Late</title>`
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(html, { headers: { 'content-type': 'text/html' } }))
    )

    await expect(fetchTitle('https://example.com')).resolves.toBeNull()
  })

  test('accepts a response with a known one-million-byte body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(htmlDocumentOfSize(maxBodyBytes), {
          headers: {
            'content-length': String(maxBodyBytes),
            'content-type': 'text/html'
          }
        })
      )
    )

    await expect(fetchTitle('https://example.com')).resolves.toBe('Pantry')
  })

  test('rejects a response with a known 1,000,001-byte body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(htmlDocumentOfSize(maxBodyBytes + 1), {
          headers: {
            'content-length': String(maxBodyBytes + 1),
            'content-type': 'text/html'
          }
        })
      )
    )

    await expect(fetchTitle('https://example.com')).resolves.toBeNull()
  })

  test('cancels a streamed HTML response once it exceeds one megabyte', async () => {
    let cancelled = false
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(maxBodyBytes))
        controller.enqueue(new Uint8Array([0]))
      },
      cancel() {
        cancelled = true
      }
    })
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(body, { headers: { 'content-type': 'text/html' } }))
    )

    await expect(fetchTitle('https://example.com')).resolves.toBeNull()
    expect(cancelled).toBe(true)
  })
})
