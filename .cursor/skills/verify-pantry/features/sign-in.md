# Sign in

Sign in lets a person with an email and password open their bookmark list, and shows an error when the password is wrong.

## Sub-features

- `sign-in-open` shows the email form on `/sign-in`.
- `sign-in-success` opens the bookmark list for the seed user.
- `sign-in-invalid` shows an alert and stays on the form.

## How to get to it (user POV)

- Open `http://127.0.0.1:4173/sign-in` while signed out.
- Follow a redirect to `/sign-in` when opening `/bookmarks` while signed out.

## Driving it with verify-pantry

Preconditions:

- `doctor.sh` is ok.
- The browser has no Pantry session for `http://127.0.0.1:4173`.

- **Open the form.** Go to `http://127.0.0.1:4173/sign-in`. The page shows the text `Pantry`, a textbox named `メール`, a textbox named `パスワード`, and a button named `サインイン`.
- **Reject a bad password.** Fill `メール` with `koralle@example.com` and `パスワード` with `wrong-password`, then click `サインイン`. An alert says `メールまたはパスワードが正しくありません` and the URL stays on `/sign-in`.
- **Sign in.** Fill `メール` with `koralle@example.com` and `パスワード` with `password`, then click `サインイン`. The navigation named `ビュー` contains `最近保存したもの`.
- **Proof.** Save an ARIA snapshot to `artifacts/sign-in/list.aria.txt` and a screenshot to `artifacts/sign-in/list.png`. Both show `最近保存したもの`.

## Gotchas

- A passkey control may also be on the page. Use the email form.
- The seed password exists only after `launch.sh` seeds port 18080.
- An existing session skips the form. Use a fresh browser context.
