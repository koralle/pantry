# Bookmark list

The bookmark list switches among recently saved bookmarks, untagged bookmarks, and favorites without changing bookmark contents.

## Sub-features

- `list-recent` shows recently saved bookmarks.
- `list-inbox` shows untagged bookmarks.
- `list-favorites` shows favorites.

## How to get to it (user POV)

- Choose `最近保存したもの` in the navigation named `ビュー`.
- Choose `未整理` in that navigation.
- Choose `お気に入り` in that navigation.
- On a narrow viewport the same three names are in the bottom navigation, also named `ビュー`.

## Driving it with verify-pantry

Preconditions:

- Signed in as `koralle@example.com`.
- `doctor.sh` is ok.
- Seed data is present.

- **Recent.** Click the link named `最近保存したもの`. The page heading is `最近保存したもの` and at least one bookmark link is visible.
- **Inbox.** Click the link named `未整理`. The URL search contains `view=inbox`.
- **Favorites.** Click the link named `お気に入り`. The URL search contains `view=favorites`.
- **Proof.** Save `artifacts/bookmark-list/favorites.aria.txt` and `artifacts/bookmark-list/favorites.png` while `お気に入り` is current.

## Gotchas

- The sidebar and the bottom tabs are both named `ビュー`. At desktop width, drive the sidebar links. At a narrow width, drive the bottom tabs. Do not require both in one viewport.
- Counts next to the labels change when bookmarks change. Assert the label and the view, not a fixed count.
- Seed marks only some bookmarks as favorites. An empty favorites list is a failure of the seed, not an empty-state success.
