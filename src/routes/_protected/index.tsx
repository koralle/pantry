import { createFileRoute, redirect } from "@tanstack/react-router";

import { validateBookmarkSearch } from "../../features/navigation/lib/bookmark-search";

export const Route = createFileRoute("/_protected/")({
  validateSearch: validateBookmarkSearch,
  beforeLoad: ({ search }) => {
    throw redirect({
      to: "/bookmarks",
      search,
      statusCode: 301,
    });
  },
});
