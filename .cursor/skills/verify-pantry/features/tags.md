# Tags

The tag manager lists tags, filters them by name, and creates a tag that then appears in the list.

## Sub-features

- `tags-open` shows the tag list.
- `tags-search` filters by the typed name.
- `tags-create` adds a tag and shows it in the list.

## How to get to it (user POV)

- Choose `タグ` in the bottom navigation named `ビュー`.
- Open `http://127.0.0.1:4173/tags` while signed in.

## Driving it with verify-pantry

Preconditions:

- Signed in as `koralle@example.com`.
- `doctor.sh` is ok.
- No tag is named `pantry-verify-tag`.

- **Open.** Go to `http://127.0.0.1:4173/tags`. The heading reads `タグ`. A button named `新規タグ` and a searchbox named `タグを検索` are visible. The seeded tag `typescript` is in the list.
- **Search.** Fill `タグを検索` with `typescript`. The list shows `typescript` and does not show `レシピ`.
- **Clear.** Clear the searchbox. `レシピ` is visible again.
- **Create.** Click `新規タグ`. A dialog heading reads `新規タグ`. Fill the name with `pantry-verify-tag` and click the button named `作成`. The list shows `pantry-verify-tag`.
- **Proof.** Save `artifacts/tags/created.aria.txt` and `artifacts/tags/created.png`.

## Gotchas

- The desktop sidebar lists individual tags and does not open the tag manager. Use `タグ` in the bottom navigation or the `/tags` URL.
- Search is the field named `タグを検索`, placeholder `タグを検索…`.
- The create dialog's confirm control is inside the dialog named `新規タグ`. If its accessible name is not visible in the snapshot, record the snapshot and stop instead of clicking a different button.
- Creating `pantry-verify-tag` mutates the verification database. The next launch seeds a fresh database, so the name is free again after cleanup and launch.
