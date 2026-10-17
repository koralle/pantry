import { reset } from "drizzle-seed";
import { uuidv7 } from "uuidv7";

import { auth, db } from "../auth";
import * as authSchema from "../src/db/schema/auth-schema";
import { bookmarkTable } from "../src/db/schema/bookmark";
import { bookmarkTagsTable } from "../src/db/schema/bookmark-tag";
import { tagsTable } from "../src/db/schema/tag";
import { toTagName } from "../src/features/tags/domain/tag-values";

const fullSchema = {
  ...authSchema,
  bookmark: bookmarkTable,
  bookmarkTags: bookmarkTagsTable,
  tags: tagsTable,
};

const TARGET = {
  email: "koralle@example.com",
  name: "koralle",
  password: "password",
} as const;

/**
 * ローカル開発で扱いやすい規模。タグはナビが溢れない程度、ブックマークは
 * 20件ページングが複数ページになる程度に留める。
 */
const BOOKMARK_COUNT = 240;

const MIN_TAGS = 30;
const MAX_TAGS = 40;
const MIN_BOOKMARKS = 200;
const MAX_BOOKMARKS = 300;

/** 決定的に生成するための固定 seed。同じ seed なら同じ構成のデータになる。 */
const RANDOM_SEED = 20_260_930;
const DAY_MS = 24 * 60 * 60 * 1000;
/** 最も古いブックマークの日付。新着順・更新順の並びを確認できる幅を取る。 */
const DATE_SPREAD_DAYS = 720;
const FAVORITE_RATE = 0.12;
const NOTE_RATE = 0.3;
/** タグなしのまま残す割合。inbox ビューの確認用。 */
const INBOX_RATE = 0.08;
/** 複数タグの topic から最後の1件を落とす割合。タグごとの件数に差を作る。 */
const TAG_DROP_RATE = 0.25;
const UPDATED_RATE = 0.35;
const MAX_UPDATE_GAP_DAYS = 30;
/** libSQL のバインド変数上限に余裕を持たせるための INSERT 分割数。 */
const INSERT_BATCH_SIZE = 100;
const EXIT_FAILURE = 1;

interface TagSeed {
  readonly color: string;
  readonly name: string;
  readonly pinned?: true;
}

interface TopicSeed {
  readonly slug: string;
  readonly tags: readonly string[];
  readonly title: string;
}

interface SourceSeed {
  readonly label: string;
  readonly url: (slug: string) => string;
}

interface PlannedBookmark {
  readonly createdAt: Date;
  readonly favorite: boolean;
  readonly id: string;
  readonly note: string | null;
  readonly tagNames: readonly string[];
  readonly title: string;
  readonly updatedAt: Date;
  readonly url: string;
}

/**
 * タグの並び順がナビの表示順（sortOrder）になる。pinned は常に先頭へ出る。
 */
const TAG_SEEDS: readonly TagSeed[] = [
  { color: "#3b82f6", name: "typescript", pinned: true },
  { color: "#eab308", name: "javascript" },
  { color: "#0ea5e9", name: "react", pinned: true },
  { color: "#06b6d4", name: "tanstack", pinned: true },
  { color: "#f97316", name: "cloudflare", pinned: true },
  { color: "#a855f7", name: "drizzle" },
  { color: "#22c55e", name: "database" },
  { color: "#ec4899", name: "css" },
  { color: "#6366f1", name: "api" },
  { color: "#8b5cf6", name: "アクセシビリティ" },
  { color: "#ef4444", name: "パフォーマンス" },
  { color: "#14b8a6", name: "テスト" },
  { color: "#7c3aed", name: "設計" },
  { color: "#64748b", name: "セキュリティ" },
  { color: "#2563eb", name: "docker" },
  { color: "#f59e0b", name: "インフラ" },
  { color: "#84cc16", name: "cli" },
  { color: "#f43f5e", name: "git" },
  { color: "#65a30d", name: "vim" },
  { color: "#0891b2", name: "ターミナル" },
  { color: "#475569", name: "資料" },
  { color: "#e11d48", name: "後で読む", pinned: true },
  { color: "#0d9488", name: "チュートリアル" },
  { color: "#a16207", name: "まとめ" },
  { color: "#0284c7", name: "ニュース" },
  { color: "#6d28d9", name: "ツール" },
  { color: "#9333ea", name: "本" },
  { color: "#dc2626", name: "動画" },
  { color: "#db2777", name: "ポッドキャスト" },
  { color: "#c026d3", name: "音楽" },
  { color: "#ea580c", name: "レシピ" },
  { color: "#d97706", name: "買い物" },
  { color: "#0f766e", name: "旅行" },
  { color: "#16a34a", name: "健康" },
  { color: "#ca8a04", name: "家計" },
  { color: "#075985", name: "習慣" },
  { color: "#8b5cf6", name: "機械学習" },
  { color: "#326ce5", name: "kubernetes" },
];

/**
 * ブックマークの題材。topic と保存先（SOURCES）の組み合わせが1件になる。
 * tags は TAG_SEEDS の name を参照し、起動時に存在を検証する。
 */
const TOPIC_SEEDS: readonly TopicSeed[] = [
  {
    slug: "typescript-satisfies",
    tags: ["typescript", "設計"],
    title: "satisfies 演算子でリテラル型を保ったまま検証する",
  },
  {
    slug: "typescript-type-puzzle",
    tags: ["typescript", "チュートリアル"],
    title: "型パズルで型システムの理解を深める",
  },
  {
    slug: "typescript-module-resolution",
    tags: ["typescript"],
    title: "moduleResolution: bundler へ移行した記録",
  },
  {
    slug: "typescript-branded-types",
    tags: ["typescript", "設計"],
    title: "ブランド型でIDの取り違えを防ぐ",
  },
  {
    slug: "javascript-event-loop",
    tags: ["javascript", "設計"],
    title: "イベントループとマイクロタスクの実行順序",
  },
  {
    slug: "javascript-proxy",
    tags: ["javascript", "設計"],
    title: "Proxy と Reflect でリアクティブな状態を作る",
  },
  {
    slug: "javascript-new-features",
    tags: ["javascript", "まとめ", "ニュース"],
    title: "ES2026 の新機能をまとめて試す",
  },
  {
    slug: "react-server-components",
    tags: ["react", "設計"],
    title: "React Server Components のデータ取得を理解する",
  },
  {
    slug: "react-use-optimistic",
    tags: ["react", "チュートリアル"],
    title: "useOptimistic で楽観的更新を実装する",
  },
  {
    slug: "react-hooks-dependencies",
    tags: ["react", "パフォーマンス"],
    title: "フックの依存配列と再レンダリングの落とし穴",
  },
  {
    slug: "react-suspense-streaming",
    tags: ["react", "パフォーマンス"],
    title: "Suspense とストリーミングSSRを組み合わせる",
  },
  {
    slug: "react-form-patterns",
    tags: ["react", "アクセシビリティ", "設計"],
    title: "React のフォーム設計とバリデーション",
  },
  {
    slug: "tanstack-router-data-loading",
    tags: ["tanstack", "react", "設計"],
    title: "TanStack Router のデータローディング戦略",
  },
  {
    slug: "tanstack-query-cache",
    tags: ["tanstack", "react", "資料"],
    title: "TanStack Query のキャッシュ無効化を整理する",
  },
  {
    slug: "tanstack-start-server-fn",
    tags: ["tanstack", "チュートリアル"],
    title: "TanStack Start の Server Functions 入門",
  },
  {
    slug: "tanstack-table-virtual",
    tags: ["tanstack", "パフォーマンス"],
    title: "TanStack Table と仮想スクロールで大量行を表示する",
  },
  {
    slug: "css-container-queries",
    tags: ["css", "設計"],
    title: "コンテナクエリで画面幅に依存しないUIを作る",
  },
  {
    slug: "css-view-transitions",
    tags: ["css", "パフォーマンス"],
    title: "View Transitions API で画面遷移をなめらかにする",
  },
  {
    slug: "css-oklch",
    tags: ["css", "設計"],
    title: "oklch で配色を設計し直す",
  },
  {
    slug: "a11y-form-checklist",
    tags: ["アクセシビリティ", "資料", "まとめ"],
    title: "フォームのアクセシビリティ実装チェックリスト",
  },
  {
    slug: "a11y-focus-management",
    tags: ["アクセシビリティ", "設計"],
    title: "フォーカス管理とキーボード操作の設計",
  },
  {
    slug: "a11y-screen-reader-list",
    tags: ["アクセシビリティ", "テスト"],
    title: "スクリーンリーダーで一覧画面を読み上げる",
  },
  {
    slug: "dialog-and-popover",
    tags: ["アクセシビリティ", "まとめ", "設計"],
    title: "モーダルと Popover の実装パターン比較",
  },
  {
    slug: "design-tokens",
    tags: ["css", "まとめ", "設計"],
    title: "デザイントークンの命名と運用",
  },
  {
    slug: "workers-observability",
    tags: ["cloudflare", "資料"],
    title: "Workers のログとトレースで障害調査を速くする",
  },
  {
    slug: "workers-bindings-types",
    tags: ["cloudflare", "typescript", "チュートリアル"],
    title: "wrangler types でバインディングを型安全に扱う",
  },
  {
    slug: "durable-objects-design",
    tags: ["cloudflare", "設計"],
    title: "Durable Objects の状態設計パターン",
  },
  {
    slug: "workers-bundle-size",
    tags: ["cloudflare", "パフォーマンス"],
    title: "Workers の起動時間を計測してバンドルを削る",
  },
  {
    slug: "cloudflare-waf",
    tags: ["cloudflare", "セキュリティ"],
    title: "WAF のルール設計とレート制限",
  },
  {
    slug: "terraform-cloudflare",
    tags: ["インフラ", "cloudflare", "チュートリアル"],
    title: "Terraform で Cloudflare の設定を管理する",
  },
  {
    slug: "docker-compose-dev",
    tags: ["docker", "チュートリアル"],
    title: "Docker Compose で開発環境を再現する",
  },
  {
    slug: "devcontainer-setup",
    tags: ["docker", "ツール", "チュートリアル"],
    title: "devcontainer で環境差をなくす",
  },
  {
    slug: "libsql-local-development",
    tags: ["database", "docker", "チュートリアル"],
    title: "libSQL をローカルの Docker で動かす",
  },
  {
    slug: "drizzle-migrations",
    tags: ["drizzle", "database", "資料"],
    title: "Drizzle のマイグレーション運用",
  },
  {
    slug: "sqlite-index-design",
    tags: ["database", "パフォーマンス", "設計"],
    title: "SQLite のインデックス設計と EXPLAIN の読み方",
  },
  {
    slug: "sql-cursor-pagination",
    tags: ["database", "api", "設計"],
    title: "カーソルページネーションを SQL で実装する",
  },
  {
    slug: "drizzle-relations",
    tags: ["drizzle", "database"],
    title: "Drizzle の relations とクエリビルダの使い分け",
  },
  {
    slug: "sqlite-fts-search",
    tags: ["database", "チュートリアル"],
    title: "SQLite の FTS で全文検索を試す",
  },
  {
    slug: "webauthn-passkey",
    tags: ["セキュリティ", "資料"],
    title: "WebAuthn とパスキーの実装ポイント",
  },
  {
    slug: "session-cookie-security",
    tags: ["セキュリティ", "設計"],
    title: "セッション管理と Cookie のセキュリティ",
  },
  {
    slug: "ip-rate-limit",
    tags: ["セキュリティ", "api", "設計"],
    title: "レート制限とクライアントIPの扱い",
  },
  {
    slug: "supply-chain-security",
    tags: ["セキュリティ", "ニュース"],
    title: "依存パッケージのサプライチェーン対策",
  },
  {
    slug: "vitest-browser-mode",
    tags: ["テスト", "チュートリアル"],
    title: "Vitest の browser mode を試す",
  },
  {
    slug: "testing-library-guide",
    tags: ["テスト", "設計"],
    title: "実装詳細に依存しないテストの書き方",
  },
  {
    slug: "testcontainers-libsql",
    tags: ["テスト", "database", "後で読む"],
    title: "Testcontainers で本物の libSQL にテストする",
  },
  {
    slug: "playwright-e2e",
    tags: ["テスト", "チュートリアル"],
    title: "Playwright で E2E テストを安定させる",
  },
  {
    slug: "api-error-design",
    tags: ["api", "資料", "設計"],
    title: "エラーレスポンスの設計とコード体系",
  },
  {
    slug: "api-versioning",
    tags: ["api", "設計"],
    title: "破壊的変更を避けるAPIバージョニング",
  },
  {
    slug: "adr-practice",
    tags: ["設計", "まとめ"],
    title: "ADR を運用に乗せるまで",
  },
  {
    slug: "docs-driven-development",
    tags: ["設計", "資料"],
    title: "ドキュメント駆動で設計を固める",
  },
  {
    slug: "gh-cli-workflow",
    tags: ["cli", "git", "チュートリアル"],
    title: "GitHub CLI で issue と PR を行き来する",
  },
  {
    slug: "git-worktree-workflow",
    tags: ["git", "cli", "ツール"],
    title: "git worktree で並行作業する",
  },
  {
    slug: "lazygit-conflict",
    tags: ["git", "ツール"],
    title: "lazygit でコンフリクト解消を速くする",
  },
  {
    slug: "neovim-lsp",
    tags: ["vim", "ターミナル", "ツール"],
    title: "Neovim の LSP と補完を整える",
  },
  {
    slug: "shell-prompt",
    tags: ["ターミナル", "cli", "習慣"],
    title: "プロンプトに実行時間と git 状態を表示する",
  },
  {
    slug: "mise-toolchain",
    tags: ["cli", "ターミナル", "チュートリアル"],
    title: "mise でツールチェーンのバージョンを固定する",
  },
  {
    slug: "conference-archive-videos",
    tags: ["動画", "資料", "後で読む"],
    title: "技術カンファレンスのアーカイブ動画",
  },
  {
    slug: "tech-podcast-list",
    tags: ["ポッドキャスト", "まとめ"],
    title: "通勤中に聴いているポッドキャスト",
  },
  {
    slug: "yearly-reading",
    tags: ["本", "まとめ"],
    title: "今年読んでよかった本",
  },
  {
    slug: "ai-agent-workflow",
    tags: ["ツール", "設計", "ニュース"],
    title: "AI コーディングエージェントとの協働術",
  },
  {
    slug: "overnight-oats",
    tags: ["レシピ", "健康"],
    title: "作り置きできるオーバーナイトオーツ",
  },
  {
    slug: "curry-spice-mix",
    tags: ["レシピ", "まとめ"],
    title: "スパイスから作るカレーの配合メモ",
  },
  {
    slug: "kitchen-tools",
    tags: ["買い物", "まとめ"],
    title: "買ってよかったキッチンツール",
  },
  {
    slug: "desk-setup",
    tags: ["買い物", "ツール"],
    title: "在宅ワークのデスク環境を見直す",
  },
  {
    slug: "kyoto-trip",
    tags: ["旅行", "まとめ"],
    title: "京都で行きたい喫茶店と銭湯",
  },
  {
    slug: "hokkaido-hiking",
    tags: ["旅行", "健康"],
    title: "北海道の日帰りハイキングコース",
  },
  {
    slug: "sleep-rhythm",
    tags: ["健康", "習慣"],
    title: "寝つきを良くする生活リズム",
  },
  {
    slug: "nisa-review",
    tags: ["家計", "まとめ"],
    title: "NISA の積立設定を見直す",
  },
  {
    slug: "household-budget-app",
    tags: ["家計", "買い物"],
    title: "家計簿アプリを乗り換えた記録",
  },
  {
    slug: "music-playlist",
    tags: ["音楽", "習慣"],
    title: "作業用プレイリストを作り直す",
  },
];

/** 保存先。title の末尾に付けて、同じ題材でも一覧で見分けられるようにする。 */
const SOURCES: readonly SourceSeed[] = [
  {
    label: "Zenn",
    url: (slug) => `https://zenn.dev/koralle/articles/${slug}`,
  },
  {
    label: "Qiita",
    url: (slug) => `https://qiita.com/koralle/items/${slug}`,
  },
  {
    label: "note",
    url: (slug) => `https://note.com/koralle/n/${slug}`,
  },
  {
    label: "Speaker Deck",
    url: (slug) => `https://speakerdeck.com/koralle/${slug}`,
  },
  {
    label: "Scrapbox",
    url: (slug) => `https://scrapbox.io/koralle/${slug}`,
  },
  {
    label: "Docswell",
    url: (slug) => `https://www.docswell.com/s/koralle/${slug}`,
  },
  {
    label: "koralle.dev",
    url: (slug) => `https://koralle.dev/posts/${slug}`,
  },
  {
    label: "GitHub",
    url: (slug) => `https://github.com/koralle/${slug}`,
  },
];

const NOTES: readonly string[] = [
  "あとで読み返す",
  "要点をメモしておく",
  "実装の参考にする",
  "比較検討中",
  "チームに共有する候補",
  "手順をなぞって確認する",
  "引用元として使う",
  "冒頭だけ読んだ",
  "読了。要点は設計メモへ転記済み",
  "あとでタグを整理する",
];

/** Park–Miller。暗号用途ではなく、実行のたびに同じ並びを作るためだけに使う。 */
const createRandom = (seed: number): (() => number) => {
  let state = seed % 2_147_483_647;
  if (state <= 0) {
    state += 2_147_483_646;
  }
  return () => {
    state = (state * 16_807) % 2_147_483_647;
    return (state - 1) / 2_147_483_646;
  };
};

const pick = <T>(items: readonly T[], random: () => number): T => {
  const item = items[Math.floor(random() * items.length)];
  if (item === undefined) {
    throw new Error("Cannot pick from an empty list");
  }
  return item;
};

/** 決定的なシャッフル。件数が小さいので splice で十分。 */
const shuffled = <T>(items: readonly T[], random: () => number): T[] => {
  const pool = [...items];
  const result: T[] = [];
  while (pool.length > 0) {
    const [item] = pool.splice(Math.floor(random() * pool.length), 1);
    if (item !== undefined) {
      result.push(item);
    }
  }
  return result;
};

const chunk = <T>(items: readonly T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
};

const assertWithinRange = (
  label: string,
  value: number,
  min: number,
  max: number
): void => {
  if (value < min || value > max) {
    throw new Error(
      `${label} must stay between ${min} and ${max}, got ${value}`
    );
  }
};

const assertSeedInvariants = (): void => {
  assertWithinRange("tags", TAG_SEEDS.length, MIN_TAGS, MAX_TAGS);
  assertWithinRange("bookmarks", BOOKMARK_COUNT, MIN_BOOKMARKS, MAX_BOOKMARKS);

  const knownTags = new Set(
    TAG_SEEDS.map((tag) => toTagName(tag.name).normalized)
  );
  if (knownTags.size !== TAG_SEEDS.length) {
    throw new Error("Tag seed contains duplicate names");
  }
  for (const topic of TOPIC_SEEDS) {
    for (const tagName of topic.tags) {
      if (!knownTags.has(toTagName(tagName).normalized)) {
        throw new Error(
          `Topic "${topic.slug}" references unknown tag "${tagName}"`
        );
      }
    }
  }
  if (TOPIC_SEEDS.length * SOURCES.length < BOOKMARK_COUNT) {
    throw new Error("Topic and source combinations are fewer than bookmarks");
  }
};

const planTagNames = (
  topic: TopicSeed,
  random: () => number
): readonly string[] => {
  if (random() < INBOX_RATE) {
    return [];
  }
  if (topic.tags.length > 1 && random() < TAG_DROP_RATE) {
    return topic.tags.slice(0, -1);
  }
  return [...topic.tags];
};

const buildBookmarkPlans = (now: Date): PlannedBookmark[] => {
  const random = createRandom(RANDOM_SEED);
  const combinations = TOPIC_SEEDS.flatMap((topic) =>
    SOURCES.map((source) => ({ source, topic }))
  );
  const selected = shuffled(combinations, random).slice(0, BOOKMARK_COUNT);
  const dayOffsets = shuffled(
    Array.from({ length: DATE_SPREAD_DAYS }, (_, index) => index),
    random
  );

  return selected.map(({ source, topic }, index) => {
    const dayOffset = dayOffsets[index];
    if (dayOffset === undefined) {
      throw new Error("Missing day offset for a bookmark");
    }

    const createdAt = new Date(
      now.getTime() - dayOffset * DAY_MS - Math.floor(random() * DAY_MS)
    );
    const updateGap =
      random() < UPDATED_RATE
        ? Math.floor(random() * MAX_UPDATE_GAP_DAYS * DAY_MS)
        : 0;
    const updatedAt = new Date(
      Math.min(createdAt.getTime() + updateGap, now.getTime())
    );

    return {
      createdAt,
      favorite: random() < FAVORITE_RATE,
      id: uuidv7(),
      note: random() < NOTE_RATE ? pick(NOTES, random) : null,
      tagNames: planTagNames(topic, random),
      title: `${topic.title} | ${source.label}`,
      updatedAt,
      url: source.url(topic.slug),
    };
  });
};

/** タグの lastUsedAt は、そのタグが付いた最新ブックマークの日時へ揃える。 */
const latestUsedAt = (
  tagName: string,
  planned: readonly PlannedBookmark[]
): Date | null => {
  const normalized = toTagName(tagName).normalized;
  const usedAt = planned
    .filter((bookmark) =>
      bookmark.tagNames.some(
        (name) => toTagName(name).normalized === normalized
      )
    )
    .map((bookmark) => bookmark.createdAt.getTime());

  return usedAt.length === 0 ? null : new Date(Math.max(...usedAt));
};

const main = async (): Promise<void> => {
  assertSeedInvariants();

  console.log("Resetting database...");
  await reset(db, fullSchema);

  console.log("Creating user...");
  const { user } = await auth.api.signUpEmail({
    body: {
      email: TARGET.email,
      name: TARGET.name,
      password: TARGET.password,
    },
  });

  if (!user) {
    throw new Error("User creation failed");
  }

  console.log(`User created: ${user.id} (${user.email})`);
  console.log("Planning seed data...");

  const now = new Date();
  const planned = buildBookmarkPlans(now);

  console.log("Seeding tags...");
  const insertedTags = await db
    .insert(tagsTable)
    .values(
      TAG_SEEDS.map((tag, index) => ({
        color: tag.color,
        lastUsedAt: latestUsedAt(tag.name, planned),
        name: tag.name,
        normalizedName: toTagName(tag.name).normalized,
        pinned: tag.pinned ?? false,
        sortOrder: index + 1,
        userId: user.id,
      }))
    )
    .returning({ id: tagsTable.id, normalizedName: tagsTable.normalizedName });

  const tagIds = new Map(
    insertedTags.map((tag) => [tag.normalizedName, tag.id])
  );

  console.log("Seeding bookmarks...");
  for (const batch of chunk(planned, INSERT_BATCH_SIZE)) {
    await db.insert(bookmarkTable).values(
      batch.map((bookmark) => ({
        createdAt: bookmark.createdAt,
        deletedAt: null,
        favorite: bookmark.favorite,
        id: bookmark.id,
        note: bookmark.note,
        title: bookmark.title,
        updatedAt: bookmark.updatedAt,
        url: bookmark.url,
        userId: user.id,
      }))
    );
  }

  console.log("Seeding bookmark_tags...");
  const joins = planned.flatMap((bookmark) =>
    bookmark.tagNames.map((tagName) => {
      const tagId = tagIds.get(toTagName(tagName).normalized);
      if (tagId === undefined) {
        throw new Error(`Missing inserted tag "${tagName}"`);
      }
      return { bookmarkId: bookmark.id, tagId };
    })
  );
  for (const batch of chunk(joins, INSERT_BATCH_SIZE)) {
    await db.insert(bookmarkTagsTable).values(batch);
  }

  const untagged = planned.filter((bookmark) => bookmark.tagNames.length === 0);
  const favorites = planned.filter((bookmark) => bookmark.favorite);
  console.log(
    `Seed complete: ${TAG_SEEDS.length} tags, ${planned.length} bookmarks ` +
      `(${untagged.length} untagged, ${favorites.length} favorites), ${joins.length} bookmark_tags`
  );
};

try {
  await main();
} catch (error) {
  console.error("Seed failed:", error);
  process.exit(EXIT_FAILURE);
}
