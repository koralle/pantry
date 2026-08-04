import { Suspense, use, useRef, useState } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

import type { BookmarkTagFieldProps, SelectableTag } from './types'
import { Blank, ErrorState, Loading, Ready } from './views'

const tagLoadErrorMessage = 'タグ候補の取得に失敗しました'

function BookmarkTagFieldContent({
  initialTags,
  selectedTagIds,
  onSelectedTagIdsChange,
  onCreateTag,
  serverError,
  onClearServerError
}: BookmarkTagFieldProps) {
  const result = use(initialTags)
  const [tags, setTags] = useState<readonly SelectableTag[]>(() =>
    result.ok ? [...result.value] : []
  )
  const selectedTagIdsRef = useRef(selectedTagIds)
  selectedTagIdsRef.current = selectedTagIds

  if (!result.ok) {
    return (
      <ErrorState
        message={tagLoadErrorMessage}
        serverError={serverError}
      />
    )
  }

  function handleCreated(tag: SelectableTag) {
    setTags((current) =>
      current.some((existing) => existing.id === tag.id) ? current : [...current, tag]
    )
    if (!selectedTagIdsRef.current.includes(tag.id)) {
      onSelectedTagIdsChange([...selectedTagIdsRef.current, tag.id])
    }
  }

  if (tags.length === 0) {
    return (
      <Blank
        onCreateTag={onCreateTag}
        onCreated={handleCreated}
        serverError={serverError}
        onClearServerError={onClearServerError}
      />
    )
  }

  return (
    <Ready
      tags={tags}
      selectedTagIds={selectedTagIds}
      onSelectedTagIdsChange={onSelectedTagIdsChange}
      onCreateTag={onCreateTag}
      onCreated={handleCreated}
      serverError={serverError}
      onClearServerError={onClearServerError}
    />
  )
}

function TagLoadErrorFallback() {
  return <ErrorState message={tagLoadErrorMessage} />
}

export function BookmarkTagField(props: BookmarkTagFieldProps) {
  return (
    <ErrorBoundary
      resetKeys={[props.initialTags]}
      FallbackComponent={TagLoadErrorFallback}>
      <Suspense fallback={<Loading serverError={props.serverError} />}>
        <BookmarkTagFieldContent {...props} />
      </Suspense>
    </ErrorBoundary>
  )
}

export type {
  BookmarkTagFieldProps,
  CreateTag,
  CreateTagError,
  CreateTagResult,
  SelectableTag,
  SelectableTagsResult
} from './types'
