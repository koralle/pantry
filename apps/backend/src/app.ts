import { createApp } from "./createApp";
import { createBookmarksService } from "./services/bookmarks";
import { createTagsService } from "./services/tags";

const app = createApp({
  bookmarksService: createBookmarksService(),
  tagsService: createTagsService(),
});

export default app;
