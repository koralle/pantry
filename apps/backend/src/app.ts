import { createApp } from "./createApp";
import { createBookmarksService } from "./services/bookmarks";

const app = createApp({
  bookmarksService: createBookmarksService(),
});

export default app;
