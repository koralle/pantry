import { reset, seed } from 'drizzle-seed'

import { auth, db } from '../auth'
import * as authSchema from '../src/db/schema/auth-schema'
import { bookmarkTable } from '../src/db/schema/bookmark'
import { bookmarkTagsTable } from '../src/db/schema/bookmark-tag'
import { tagsTable } from '../src/db/schema/tag'

const fullSchema = {
  ...authSchema,
  bookmark: bookmarkTable,
  bookmarkTags: bookmarkTagsTable,
  tags: tagsTable
}

const TARGET = {
  email: 'koralle@example.com',
  name: 'koralle',
  password: 'password'
} as const

const COUNTS = {
  tags: 500,
  bookmarks: 200,
  bookmarkTags: 300
} as const

const EXIT_FAILURE = 1

const range = (length: number): number[] => Array.from({ length }, (_, index) => index)

const tagNames = range(COUNTS.tags).map((index) => `tag-${String(index + 1).padStart(3, '0')}`)
const bookmarkUrls = range(COUNTS.bookmarks).map(
  (index) => `https://example.com/bookmark/${index + 1}`
)

const main = async (): Promise<void> => {
  console.log('Resetting database...')
  await reset(db, fullSchema)

  console.log('Creating user...')
  const { user } = await auth.api.signUpEmail({
    body: {
      email: TARGET.email,
      password: TARGET.password,
      name: TARGET.name
    }
  })

  if (!user) {
    throw new Error('User creation failed')
  }

  console.log(`User created: ${user.id} (${user.email})`)

  console.log('Seeding tags, bookmarks, and bookmark_tags...')

  await seed(db, { tagsTable, bookmarkTable, bookmarkTagsTable }).refine((funcs) => ({
    tagsTable: {
      count: COUNTS.tags,
      columns: {
        userId: funcs.valuesFromArray({ values: [user.id] }),
        name: funcs.valuesFromArray({ values: tagNames, isUnique: true })
      }
    },
    bookmarkTable: {
      count: COUNTS.bookmarks,
      columns: {
        id: funcs.uuid(),
        userId: funcs.valuesFromArray({ values: [user.id] }),
        url: funcs.valuesFromArray({ values: bookmarkUrls, isUnique: true }),
        title: funcs.string({ isUnique: false })
      }
    },
    bookmarkTagsTable: {
      count: COUNTS.bookmarkTags
    }
  }))

  console.log('Seed complete.')
}

try {
  await main()
} catch (error) {
  console.error('Seed failed:', error)
  process.exit(EXIT_FAILURE)
}
