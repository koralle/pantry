import { Input } from '@base-ui/react'
import { Field, getInput, useForm } from '@formisch/react'
import { createFileRoute, Link, useNavigate, useRouter } from '@tanstack/react-router'
import { ArrowLeft, CircleAlert } from 'lucide-react'
import { Suspense, use, useActionState, useState } from 'react'
import { ErrorBoundary, getErrorMessage } from 'react-error-boundary'
import type { FallbackProps } from 'react-error-boundary'
import * as v from 'valibot'

import { UiError, UiLoading } from '../../../components/ui-state'
import type { TagSelectType } from '../../../db/schema/tag'
import { TagEditFields } from '../../../features/tags/components/tag-edit-fields'
import { getTag, updateTag } from '../../../features/tags/tag.function'
import {
  button,
  field,
  fieldInput,
  fieldLabel,
  formSummary,
  srOnly,
  textLink,
  workbench,
  workbenchFields,
  workbenchForm,
  workbenchLead,
  workbenchNav,
  workbenchTitle
} from '../../../styles/ui'

const tagIdParamSchema = v.pipe(v.string(), v.transform(Number), v.integer('Invalid tag id'))

export const Route = createFileRoute('/_protected/tags/$id/edit')({
  loader: async ({ params }) => {
    const id = v.parse(tagIdParamSchema, params.id)
    const tagPromise = getTag({ data: { id } })

    return {
      tagPromise
    }
  },
  component: RouteComponent
})

function EditError({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <UiError
      message={getErrorMessage(error) ?? 'タグの読み込みに失敗しました'}
      onRetry={resetErrorBoundary}
    />
  )
}

function RouteComponent() {
  const { tagPromise } = Route.useLoaderData()
  const navigate = useNavigate()
  const router = useRouter()

  async function submitAction(input: {
    id: number
    name: string
    pinned: boolean
    color: string | null
    sortOrder: number
  }) {
    const { id: updatedId } = await updateTag({
      data: {
        id: input.id,
        name: input.name,
        pinned: input.pinned,
        color: input.color,
        sortOrder: input.sortOrder
      }
    })

    await router.invalidate()
    await navigate({
      to: '/tags/$id',
      params: { id: String(updatedId) },
      state: { tagUpdated: true }
    })
  }

  return (
    <div className={workbench}>
      <nav className={workbenchNav}>
        <Link
          to='/tags'
          search={{ limit: 50, offset: 0 }}
          className={textLink}>
          <ArrowLeft
            size={16}
            aria-hidden
          />{' '}
          一覧へ戻る
        </Link>
      </nav>

      <h1 className={workbenchTitle}>タグ編集</h1>
      <p className={workbenchLead}>名前・ピン・色・並び順を更新します</p>

      <ErrorBoundary FallbackComponent={EditError}>
        <Suspense fallback={<UiLoading label='タグを読み込み中' />}>
          <EditTagForm
            tagPromise={tagPromise}
            submitAction={submitAction}
          />
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}

interface EditTagFormProps {
  readonly tagPromise: Promise<TagSelectType>
  readonly submitAction: (input: {
    id: number
    name: string
    pinned: boolean
    color: string | null
    sortOrder: number
  }) => Promise<void>
}

function EditTagForm({ tagPromise, submitAction }: EditTagFormProps) {
  const tag = use(tagPromise)
  const [pinned, setPinned] = useState(tag.pinned)
  const [color, setColor] = useState<string | null>(tag.color)
  const [sortOrder, setSortOrder] = useState(tag.sortOrder)
  const [formError, setFormError] = useState<string | null>(null)

  const editTagFormSchema = v.object({
    name: v.string()
  })

  const editTagForm = useForm({
    initialInput: {
      name: tag.name
    },
    schema: editTagFormSchema
  })

  const [, throwError, isPending] = useActionState(async () => {
    setFormError(null)
    const currentRawName = getInput(editTagForm, { path: ['name'] }) ?? ''

    try {
      await submitAction({
        id: tag.id,
        name: currentRawName,
        pinned,
        color,
        sortOrder
      })
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'タグの更新に失敗しました')
    }
  }, null)

  return (
    <form
      className={workbenchForm}
      action={throwError}>
      {formError != null ? (
        <div
          className={formSummary}
          role='alert'
          aria-live='polite'>
          <p>
            <CircleAlert
              size={16}
              aria-hidden
            />{' '}
            {formError}
          </p>
        </div>
      ) : null}

      <fieldset
        className={workbenchFields}
        disabled={isPending}>
        <legend className={srOnly}>タグ編集</legend>

        <Field
          of={editTagForm}
          path={['name']}>
          {(fieldProps) => (
            <div className={field}>
              <label
                className={fieldLabel}
                htmlFor={fieldProps.props.name}>
                タグ名
              </label>
              <Input
                className={fieldInput}
                id={fieldProps.props.name}
                value={fieldProps.input}
                type='text'
                onValueChange={(newValue) => {
                  fieldProps.onChange(newValue)
                }}
                required
              />
            </div>
          )}
        </Field>

        <TagEditFields
          pinned={pinned}
          color={color}
          sortOrder={sortOrder}
          onPinnedChange={setPinned}
          onColorChange={setColor}
          onSortOrderChange={setSortOrder}
          disabled={isPending}
        />
      </fieldset>

      <button
        type='submit'
        className={button({ visual: 'accent' })}
        disabled={isPending}>
        {isPending ? '更新中...' : '更新'}
      </button>
    </form>
  )
}
