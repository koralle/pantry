import {
  brand,
  email,
  InferOutput,
  maxLength,
  minLength,
  nonEmpty,
  object,
  pipe,
  string
} from 'valibot'

import { PASSWORD_MAX_LENGTH } from '../domain/password-policy'

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
  maxLength(PASSWORD_MAX_LENGTH, 'Your password must have 128 characters or fewer.'),
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
