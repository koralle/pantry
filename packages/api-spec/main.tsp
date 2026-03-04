import "@typespec/http";
import "@typespec/rest";
import "@typespec/openapi3";

using TypeSpec.Http;
using TypeSpec.Rest;

@service(#{ title: "Pantry API" })
@server("https://api.example.com", "Production")
@useAuth(SessionCookieAuth | BearerAuth)
namespace PantryApi;

alias SessionCookieAuth = ApiKeyAuth<ApiKeyLocation.cookie, "pantry_session">;

/**
 * MVP API contract draft for bookmarks/tags.
 * - REST
 * - Cookie + Bearer authentication (401 when unauthenticated)
 * - Tags are normalized server-side: trim + lowercase + dedupe
 */

enum BookmarkSort {
  newest: "newest",
  updated: "updated",
}

enum TagFilterMode {
  and: "and",
  or: "or",
}

enum ErrorCode {
  INVALID_INPUT: "INVALID_INPUT",
  UNAUTHORIZED: "UNAUTHORIZED",
  NOT_FOUND: "NOT_FOUND",
  URL_CONFLICT: "URL_CONFLICT",
  INVALID_CURSOR: "INVALID_CURSOR",
  CURSOR_MISMATCH: "CURSOR_MISMATCH",
  INTERNAL_ERROR: "INTERNAL_ERROR",
}

@format("uuid")
@pattern("^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$")
scalar BookmarkId extends string;

@minLength(1)
@maxLength(32)
scalar TagInput extends string;

@minLength(1)
@maxLength(2048)
@format("uri")
scalar BookmarkUrl extends string;

@minLength(1)
@maxLength(512)
scalar BookmarkTitle extends string;

@maxLength(4000)
scalar BookmarkNote extends string;

model ErrorBody<Code extends ErrorCode = ErrorCode> {
  code: Code;
  message: string;
  details?: string[];
}

@error
model UnauthorizedError {
  @statusCode statusCode: 401;
  error: ErrorBody<ErrorCode.UNAUTHORIZED>;
}

@error
model BadRequestError {
  @statusCode statusCode: 400;
  error: ErrorBody<ErrorCode.INVALID_INPUT>;
}

@error
model NotFoundError {
  @statusCode statusCode: 404;
  error: ErrorBody<ErrorCode.NOT_FOUND>;
}

@error
model ConflictError {
  @statusCode statusCode: 409;
  error: ErrorBody<ErrorCode.URL_CONFLICT>;
}

@error
model InvalidCursorError {
  @statusCode statusCode: 400;
  error: ErrorBody<ErrorCode.INVALID_CURSOR>;
}

@error
model CursorMismatchError {
  @statusCode statusCode: 400;
  error: ErrorBody<ErrorCode.CURSOR_MISMATCH>;
}

model BookmarkSummary {
  id: BookmarkId;
  url: BookmarkUrl;
  title: BookmarkTitle;
  note?: BookmarkNote;
  tags: string[];
  createdAt: utcDateTime;
  updatedAt: utcDateTime;
}

model BookmarkDetail extends BookmarkSummary {}

model ListBookmarksQuery {
  @query q?: string;
  // Repeat query key form only: tags=a&tags=b
  // Server additionally trims values; empty after trim is INVALID_INPUT.
  @maxItems(20)
  @query(#{ name: "tags", explode: true }) tags?: TagInput[];
  @query tagMode?: TagFilterMode = TagFilterMode.and;
  @query sort?: BookmarkSort = BookmarkSort.newest;
  @minValue(1)
  @maxValue(100)
  @query limit?: int32 = 20;
  @query cursor?: string;
}

model ListBookmarksOk {
  @statusCode statusCode: 200;
  items: BookmarkSummary[];
  nextCursor: string | null;
}

model GetBookmarkOk {
  @statusCode statusCode: 200;
  bookmark: BookmarkDetail;
}

model CreateBookmarkRequest {
  url: BookmarkUrl;
  title?: BookmarkTitle;
  note?: BookmarkNote;
  // Server enforces: <= 20 items, each item trim+lowercase, dedupe
  @maxItems(20)
  tags?: TagInput[];
}

model CreateBookmarkCreated {
  @statusCode statusCode: 201;
  bookmark: BookmarkDetail;
}

model UpdateBookmarkRequest {
  url?: BookmarkUrl;
  title?: BookmarkTitle;
  // null means clearing the existing note
  note?: BookmarkNote | null;
  // Full replace semantics for tags when provided
  @maxItems(20)
  tags?: TagInput[];
}

model UpdateBookmarkOk {
  @statusCode statusCode: 200;
  bookmark: BookmarkDetail;
}

model SuggestTagsQuery {
  // Server trims q; empty after trim is INVALID_INPUT
  @minLength(1)
  @query q: string;
  @minValue(1)
  @maxValue(20)
  @query limit?: int32 = 10;
}

model TagSuggestion {
  name: string;
  count: int32;
}

model SuggestTagsOk {
  @statusCode statusCode: 200;
  items: TagSuggestion[];
}

@route("/v1")
namespace V1 {
  @route("/bookmarks")
  @tag("bookmarks")
  interface BookmarksApi {
    @get
    op list(
      ...ListBookmarksQuery,
    ): ListBookmarksOk | UnauthorizedError | BadRequestError | InvalidCursorError | CursorMismatchError;

    @post
    op create(
      @body body: CreateBookmarkRequest,
    ): CreateBookmarkCreated | UnauthorizedError | BadRequestError | ConflictError;

    @get
    @route("/{bookmarkId}")
    op get(@path bookmarkId: BookmarkId): GetBookmarkOk | UnauthorizedError | NotFoundError;

    @patch(#{ implicitOptionality: false })
    @route("/{bookmarkId}")
    op update(
      @path bookmarkId: BookmarkId,
      @body body: UpdateBookmarkRequest,
    ): UpdateBookmarkOk | UnauthorizedError | BadRequestError | NotFoundError | ConflictError;

    @delete
    @route("/{bookmarkId}")
    op delete(@path bookmarkId: BookmarkId): NoContentResponse | UnauthorizedError | NotFoundError;
  }

  @route("/tags")
  @tag("tags")
  interface TagsApi {
    @get
    @route("/suggest")
    op suggest(...SuggestTagsQuery): SuggestTagsOk | UnauthorizedError | BadRequestError;
  }
}
