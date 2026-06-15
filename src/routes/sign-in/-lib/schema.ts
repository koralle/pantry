import { brand, object, email, nonEmpty, string, minLength, pipe, InferOutput } from 'valibot'

export const emailSchema = pipe(
  string('Please enter your email.'),
  nonEmpty('Please enter your email.'),
  email('The email address is badly formatted.'),
  brand('Email')
)

export const passwordSchema = pipe(
  string('Please enter your password.'),
  nonEmpty('Please enter your password.'),
  minLength(8, 'Your password must have 8 characters or more.'),
  brand('Password')
)

export type Email = InferOutput<typeof emailSchema>
export type Password = InferOutput<typeof passwordSchema>

export const signInSchema = pipe(
  object({
    email: pipe(emailSchema),
    password: pipe(passwordSchema)
  })
)

export type SignInSchema = InferOutput<typeof signInSchema>
