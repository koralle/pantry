# Register from the full form

The full form saves a URL, title, and note, then opens the new bookmark. The empty-list button is a different entry from typing the URL.

## Sub-features

- `register-empty` opens the form from an empty recent list.
- `register-direct` opens the form at `/bookmarks/new` on a seeded list.
- `register-save` stores the title and note.
- `register-cancel` leaves the list unchanged.

## How to get to it (user POV)

- On an empty recent list, choose `最初の1件を登録`.
- Open `http://127.0.0.1:4173/bookmarks/new` while signed in.

## Driving it with verify-pantry

Preconditions:

- Signed in as `koralle@example.com`.
- `doctor.sh` is ok.
- No bookmark is titled `Pantry full form proof`.

- **Direct entry.** Open `http://127.0.0.1:4173/bookmarks/new`. The heading reads `ブックマークを登録`. Textboxes are named `URL`, `タイトル`, and `メモ`.
- **Fill the form.** Fill `URL` with `https://example.com/pantry-full-form-proof`, `タイトル` with `Pantry full form proof`, and `メモ` with `verification note`. Do not click `タイトルを取得`.
- **Save.** Click the button named `登録する`. The detail heading reads `Pantry full form proof`.
- **Database.** Run `.cursor/skills/verify-pantry/scripts/query-url.sh 'https://example.com/pantry-full-form-proof'`. One row returns that URL and title.
- **Cancel.** Open `/bookmarks/new` again, fill `タイトル` with `Pantry discard me`, and click the link named `キャンセル`. The bookmark list is shown and `query-url.sh` for a URL you did not save returns `[]`.
- **Proof.** Save `artifacts/register-bookmark/detail.aria.txt`, `artifacts/register-bookmark/detail.png`, and `artifacts/register-bookmark/row.json`.

## Gotchas

- After seed, the recent list is not empty, so `最初の1件を登録` is absent. That entry stays unverified until a run starts from an empty database. Do not treat the direct URL as proof of the empty-list button.
- `キャンセル` is a link back to the list, not a button.
- `タイトルを取得` calls the URL's host. Skip it when the typed title is the assertion.
