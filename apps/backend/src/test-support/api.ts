import { env, SELF } from "cloudflare:test";

const TEST_BASE_URL = "https://pantry.test";
const UUID_V7_REGEXP = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

let migrationsApplied = false;

const INITIAL_SCHEMA_STATEMENTS = [
  "CREATE TABLE IF NOT EXISTS bookmarks (id text PRIMARY KEY NOT NULL, user_id text NOT NULL, url text NOT NULL, title text NOT NULL, note text, created_at text NOT NULL, updated_at text NOT NULL, deleted_at text)",
  "CREATE TABLE IF NOT EXISTS tags (id text PRIMARY KEY NOT NULL, user_id text NOT NULL, name text NOT NULL, created_at text NOT NULL)",
  "CREATE TABLE IF NOT EXISTS bookmark_tags (bookmark_id text NOT NULL, tag_id text NOT NULL, PRIMARY KEY (bookmark_id, tag_id), FOREIGN KEY (bookmark_id) REFERENCES bookmarks(id) ON DELETE cascade, FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE cascade)",
  "CREATE UNIQUE INDEX IF NOT EXISTS bookmarks_user_url_active_unique ON bookmarks (user_id, url) WHERE deleted_at IS NULL",
  "CREATE INDEX IF NOT EXISTS bookmarks_user_created_idx ON bookmarks (user_id, created_at DESC)",
  "CREATE INDEX IF NOT EXISTS bookmarks_user_updated_idx ON bookmarks (user_id, updated_at DESC)",
  "CREATE UNIQUE INDEX IF NOT EXISTS tags_user_name_unique ON tags (user_id, name)",
  "CREATE INDEX IF NOT EXISTS tags_user_name_idx ON tags (user_id, name)",
  "CREATE INDEX IF NOT EXISTS bookmark_tags_bookmark_idx ON bookmark_tags (bookmark_id)",
  "CREATE INDEX IF NOT EXISTS bookmark_tags_tag_idx ON bookmark_tags (tag_id)",
];

export const expectUuidV7 = (value: string) => {
  expect(value).toMatch(UUID_V7_REGEXP);
};

export const expectJsonError = async (response: Response, status: number, code: string) => {
  expect(response.status).toBe(status);
  expect(response.headers.get("content-type") ?? "").toContain("application/json");

  const body = (await response.json()) as {
    error?: {
      code?: string;
    };
  };
  expect(body).toMatchObject({
    error: {
      code,
    },
  });
};

export const ensureTestDatabase = async () => {
  if (migrationsApplied) {
    return;
  }

  for (const statement of INITIAL_SCHEMA_STATEMENTS) {
    await env.DB.exec(statement);
  }
  migrationsApplied = true;
};

export const resetTestDatabase = async () => {
  await ensureTestDatabase();
  await env.DB.exec(`
    DELETE FROM bookmark_tags;
    DELETE FROM tags;
    DELETE FROM bookmarks;
  `);
};

export const apiRequest = (path: string, init?: RequestInit) => {
  return SELF.fetch(`${TEST_BASE_URL}${path}`, init);
};

export const createBookmark = async (body: Record<string, unknown>) => {
  const response = await apiRequest("/v1/bookmarks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  expect(response.status).toBe(201);
  const payload = (await response.json()) as {
    bookmark: {
      id: string;
      url: string;
      title: string;
      note?: string;
      tags: string[];
      createdAt: string;
      updatedAt: string;
    };
  };

  return payload.bookmark;
};
