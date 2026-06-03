export interface BookmarkSummary {
  id: string
  url: string
  title: string
  note: string | null
  tags: string[]
  createdAt: string
  updatedAt: string
}

export type BookmarkDetail = BookmarkSummary

export interface Tag {
  id: string
  name: string
  count: number
  createdAt: string
}

export interface TagSuggestion {
  name: string
  count: number
}

export interface ListBookmarksResponse {
  items: BookmarkSummary[]
  nextCursor: string | null
}

export interface ListTagsResponse {
  items: Tag[]
}

export interface SuggestTagsResponse {
  items: TagSuggestion[]
}

interface RequestOptions {
  method?: string
  body?: unknown
  query?: Record<string, string | string[] | number | undefined | null>
}

function buildUrl(
  path: string,
  query?: Record<string, string | string[] | number | undefined | null>
): string {
  const url = new URL(path, window.location.origin)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) {
        continue
      }
      if (Array.isArray(value)) {
        for (const v of value) {
          url.searchParams.append(key, v)
        }
      } else {
        url.searchParams.set(key, String(value))
      }
    }
  }
  return url.toString()
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = buildUrl(path, options.query)
  const headers: Record<string, string> = {}
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  const fetchOptions: RequestInit = {
    credentials: 'include',
    headers,
    method: options.method ?? 'GET'
  }
  if (options.body) {
    fetchOptions.body = JSON.stringify(options.body)
  }

  const response = await fetch(url, fetchOptions)

  if (!response.ok) {
    const body = await response
      .json()
      .catch(() => ({ error: { code: 'UNKNOWN', message: 'Unknown error' } }))
    const errBody = body as { error?: { code?: string; message?: string } }
    throw new ApiError(
      response.status,
      errBody.error?.code ?? 'UNKNOWN',
      errBody.error?.message ?? 'Unknown error'
    )
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json()
}

export class ApiError extends Error {
  override readonly name = 'ApiError'
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

export const api = {
  bookmarks: {
    async create(data: { url: string; title?: string; note?: string; tags?: string[] }) {
      return request<{ bookmark: BookmarkDetail }>('/api/v1/bookmarks', {
        method: 'POST',
        body: data
      })
    },

    async delete(id: string) {
      return request<void>(`/api/v1/bookmarks/${id}`, { method: 'DELETE' })
    },

    async get(id: string) {
      return request<{ bookmark: BookmarkDetail }>(`/api/v1/bookmarks/${id}`)
    },

    async list(params?: {
      q?: string
      tags?: string[]
      tagMode?: 'and' | 'or'
      sort?: 'newest' | 'updated'
      limit?: number
      cursor?: string
    }) {
      return request<ListBookmarksResponse>('/api/v1/bookmarks', {
        query: {
          q: params?.q,
          tags: params?.tags,
          tagMode: params?.tagMode,
          sort: params?.sort,
          limit: params?.limit,
          cursor: params?.cursor
        }
      })
    },

    async update(
      id: string,
      data: { url?: string; title?: string; note?: string | null; tags?: string[] }
    ) {
      return request<{ bookmark: BookmarkDetail }>(`/api/v1/bookmarks/${id}`, {
        method: 'PATCH',
        body: data
      })
    }
  },

  tags: {
    async delete(id: string) {
      return request<void>(`/api/v1/tags/${id}`, { method: 'DELETE' })
    },

    async list() {
      return request<ListTagsResponse>('/api/v1/tags')
    },

    async rename(id: string, name: string) {
      return request<{ tag: Tag }>(`/api/v1/tags/${id}`, {
        method: 'PATCH',
        body: { name }
      })
    },

    async suggest(q: string, limit?: number) {
      return request<SuggestTagsResponse>('/api/v1/tags/suggest', {
        query: { q, limit }
      })
    }
  }
}
