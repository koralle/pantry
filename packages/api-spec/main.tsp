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

model ErrorBody {
  code: string;
  message: string;
  details?: string[];
}

@error
model UnauthorizedError {
  @statusCode statusCode: 401;
  error: ErrorBody;
}

@error
model BadRequestError {
  @statusCode statusCode: 400;
  error: ErrorBody;
}

@error
model NotFoundError {
  @statusCode statusCode: 404;
  error: ErrorBody;
}

@error
model ConflictError {
  @statusCode statusCode: 409;
  error: ErrorBody;
}

model BookmarkSummary {
  id: string;
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
  @query tags?: string[];
  @query tagMode?: TagFilterMode;
  @query sort?: BookmarkSort;
  @query limit?: int32;
  @query cursor?: string;
}

model ListBookmarksOk {
  @statusCode statusCode: 200;
  items: BookmarkSummary[];
  nextCursor?: string;
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
  @query q: string;
  @query limit?: int32;
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
  interface BookmarksApi {
    @get
    op list(...ListBookmarksQuery): ListBookmarksOk | UnauthorizedError | BadRequestError;

    @post
    op create(
      @body body: CreateBookmarkRequest,
    ): CreateBookmarkCreated | UnauthorizedError | BadRequestError | ConflictError;

    @get
    @route("/{bookmarkId}")
    op get(@path bookmarkId: string): GetBookmarkOk | UnauthorizedError | NotFoundError;

    @patch(#{ implicitOptionality: false })
    @route("/{bookmarkId}")
    op update(
      @path bookmarkId: string,
      @body body: UpdateBookmarkRequest,
    ): UpdateBookmarkOk | UnauthorizedError | BadRequestError | NotFoundError | ConflictError;

    @delete
    @route("/{bookmarkId}")
    op delete(@path bookmarkId: string): NoContentResponse | UnauthorizedError | NotFoundError;
  }

  @route("/tags")
  interface TagsApi {
    @get
    @route("/suggest")
    op suggest(...SuggestTagsQuery): SuggestTagsOk | UnauthorizedError | BadRequestError;
  }
}
