import { reset, seed } from "drizzle-seed";

import { auth, db } from "../auth";
import * as authSchema from "../src/db/schema/auth-schema";
import { bookmarkTable } from "../src/db/schema/bookmark";
import { bookmarkTagsTable } from "../src/db/schema/bookmark-tag";
import { tagsTable } from "../src/db/schema/tag";

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

const COUNTS = {
  bookmarkTags: 300,
  bookmarks: 200,
  tags: 500,
} as const;

const EXIT_FAILURE = 1;

const range = (length: number): number[] =>
  Array.from({ length }, (_, index) => index);

const tagNames = range(COUNTS.tags).map(
  (index) => `tag-${String(index + 1).padStart(3, "0")}`
);
const bookmarkUrls = range(COUNTS.bookmarks).map(
  (index) => `https://example.com/bookmark/${index + 1}`
);

const main = async (): Promise<void> => {
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

  console.log("Seeding tags, bookmarks, and bookmark_tags...");

  await seed(db, { bookmarkTable, bookmarkTagsTable, tagsTable }).refine(
    (funcs) => ({
      bookmarkTable: {
        columns: {
          id: funcs.uuid(),
          title: funcs.string({ isUnique: false }),
          url: funcs.valuesFromArray({ isUnique: true, values: bookmarkUrls }),
          userId: funcs.valuesFromArray({ values: [user.id] }),
        },
        count: COUNTS.bookmarks,
      },
      bookmarkTagsTable: {
        count: COUNTS.bookmarkTags,
      },
      tagsTable: {
        columns: {
          name: funcs.valuesFromArray({ isUnique: true, values: tagNames }),
          normalizedName: funcs.valuesFromArray({
            isUnique: true,
            values: tagNames,
          }),
          userId: funcs.valuesFromArray({ values: [user.id] }),
        },
        count: COUNTS.tags,
      },
    })
  );

  console.log("Seed complete.");
};

try {
  await main();
} catch (error) {
  console.error("Seed failed:", error);
  process.exit(EXIT_FAILURE);
}
