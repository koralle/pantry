import { eq } from 'drizzle-orm'

import { auth, db } from '../auth'
import * as schema from '../src/db/schema/auth-schema'

const EXIT_SUCCESS = 0
const EXIT_FAILURE = 1
const QUERY_LIMIT = 1

const TARGET = {
  email: 'koralle@example.com',
  name: 'koralle',
  password: 'password'
} as const

const main = async (): Promise<void> => {
  const [existing] = await db
    .select()
    .from(schema.user)
    .where(eq(schema.user.email, TARGET.email))
    .limit(QUERY_LIMIT)

  if (existing) {
    console.log(`User "${TARGET.email}" already exists. Skipping.`)
    process.exit(EXIT_SUCCESS)
  }

  await auth.api.createUser({
    body: TARGET
  })

  console.log(`User created: ${TARGET.email}`)
}

try {
  await main()
} catch (error) {
  console.error('Failed to create user:', error)
  process.exit(EXIT_FAILURE)
}
