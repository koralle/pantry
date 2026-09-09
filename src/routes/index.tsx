import { createFileRoute, redirect } from "@tanstack/react-router";
import * as v from "valibot";

import { bookmarkSearchSchema } from "../features/navigation/lib/bookmark-search";

export const Route = createFileRoute("/")({
  validateSearch: (search) => v.parse(bookmarkSearchSchema, search),
  beforeLoad: ({ search }) => {
    throw redirect({
      to: "/bookmarks",
      search,
      statusCode: 301,
    });
  },
});
