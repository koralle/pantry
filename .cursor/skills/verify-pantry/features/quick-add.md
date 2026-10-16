# Quick add

Quick add saves a bookmark from a URL, shows `保存しました`, and opens the same bookmark on its detail page.

## Sub-features

- `quick-add-header` opens quick add from the header.
- `quick-add-tab` opens quick add from the bottom tab.
- `quick-add-save` stores the URL and a title.
- `quick-add-detail` shows that title on the detail page.

## How to get to it (user POV)

- Choose `登録` in the header (desktop width).
- Choose the bottom-tab control named `ブックマークを登録`.
- Open `http://127.0.0.1:4173/bookmarks/quick` while signed in.

## Driving it with verify-pantry

Preconditions:

- Signed in as `koralle@example.com` at `http://127.0.0.1:4173`.
- `doctor.sh` is ok.
- No bookmark uses the proof URL `https://example.com/pantry-verify-proof`.

- **Header entry.** Click the link named `登録`. The heading reads `ブックマークを登録` and a textbox named `URL` is visible.
- **Enter the URL.** Fill `URL` with `https://example.com/pantry-verify-proof` and click the button named `登録する`. Wait until the heading is `保存しました` or a title field is shown. If a title textbox is visible, fill it with `Pantry verify proof` and click `登録する` again.
- **Done state.** The heading `保存しました` is visible and the title text is either `Pantry verify proof` or the fetched title for that URL.
- **Second view.** Click the link named `詳細を見る`. The detail heading is that same title.
- **Database.** Run `.cursor/skills/verify-pantry/scripts/query-url.sh 'https://example.com/pantry-verify-proof'`. The JSON array contains one object whose `url` is that proof URL.
- **Proof.** Save the detail ARIA snapshot to `artifacts/quick-add/detail.aria.txt`, the screenshot to `artifacts/quick-add/detail.png`, and the query JSON to `artifacts/quick-add/row.json`.

## Gotchas

- The header link `登録` is hidden below the `md` breakpoint. A narrow viewport still has `ブックマークを登録` in the bottom tab, and that is a separate entry point.
- Clicking `登録する` on the URL step fetches the page title from the network before the confirm step. Wait for `保存しました` or the title field. Do not assert a fixed sleep.
- If title fetch fails, the domain is used unless a title is typed. Assert the title you see on `保存しました` and again on the detail page.
- `query-url.sh` reads port 18080 only. An empty array means the save did not land in the verification database.
