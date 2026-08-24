import { describe, expect, test, vi } from 'vitest'

import { fetchPageTitle } from './fetch-page-title.server'

describe('fetchPageTitle', () => {
  test('extracts title from HTML', async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response('<html><head><title>Example title</title></head></html>', {
          status: 200,
          headers: { 'content-type': 'text/html' }
        })
    )

    expect(await fetchPageTitle('https://example.com', fetchMock)).toEqual({
      kind: 'fetched',
      title: 'Example title'
    })
  })

  test('rejects private hosts as url-not-allowed', async () => {
    expect(await fetchPageTitle('http://127.0.0.1')).toEqual({ kind: 'url-not-allowed' })
    expect(await fetchPageTitle('http://localhost/')).toEqual({ kind: 'url-not-allowed' })
    expect(await fetchPageTitle('http://192.168.1.1/')).toEqual({ kind: 'url-not-allowed' })
  })

  test('rejects IPv4-mapped IPv6 loopback as url-not-allowed', async () => {
    expect(await fetchPageTitle('http://[::ffff:127.0.0.1]/')).toEqual({ kind: 'url-not-allowed' })
    expect(await fetchPageTitle('http://[::ffff:10.0.0.1]/')).toEqual({ kind: 'url-not-allowed' })
    expect(await fetchPageTitle('http://[::1]/')).toEqual({ kind: 'url-not-allowed' })
  })

  test('rejects private IPv6 ranges as url-not-allowed', async () => {
    expect(await fetchPageTitle('http://[fc00::1]/')).toEqual({ kind: 'url-not-allowed' })
    expect(await fetchPageTitle('http://[fd12:3456:789a::1]/')).toEqual({ kind: 'url-not-allowed' })
    expect(await fetchPageTitle('http://[fe80::1]/')).toEqual({ kind: 'url-not-allowed' })
  })

  test('returns unavailable on network failure', async () => {
    const failingFetch = vi.fn(async () => {
      throw new Error('network down')
    })

    expect(await fetchPageTitle('https://offline.example', failingFetch)).toEqual({
      kind: 'unavailable'
    })
  })

  test('follows limited redirects and validates each hop', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url === 'https://example.com/start') {
        return new Response(null, {
          status: 302,
          headers: { location: 'https://example.com/final' }
        })
      }
      return new Response('<title>Final</title>', {
        status: 200,
        headers: { 'content-type': 'text/html; charset=utf-8' }
      })
    })

    expect(await fetchPageTitle('https://example.com/start', fetchMock)).toEqual({
      kind: 'fetched',
      title: 'Final'
    })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  test('rejects redirect to private host as url-not-allowed', async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(null, {
          status: 302,
          headers: { location: 'http://127.0.0.1/secret' }
        })
    )

    expect(await fetchPageTitle('https://example.com/start', fetchMock)).toEqual({
      kind: 'url-not-allowed'
    })
  })

  test('non-ok status is unavailable', async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response('<title>gone</title>', {
          status: 404,
          headers: { 'content-type': 'text/html' }
        })
    )

    expect(await fetchPageTitle('https://example.com/missing', fetchMock)).toEqual({
      kind: 'unavailable'
    })
  })

  test('unsupported content type is unavailable', async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response('{"title":"json"}', {
          status: 200,
          headers: { 'content-type': 'application/json' }
        })
    )

    expect(await fetchPageTitle('https://example.com/api', fetchMock)).toEqual({
      kind: 'unavailable'
    })
  })

  test('page without title is unavailable', async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response('<html><body>no title here</body></html>', {
          status: 200,
          headers: { 'content-type': 'text/html' }
        })
    )

    expect(await fetchPageTitle('https://example.com', fetchMock)).toEqual({
      kind: 'unavailable'
    })
  })
})
