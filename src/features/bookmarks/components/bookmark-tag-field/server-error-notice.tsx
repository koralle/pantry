import { fieldError } from '../../../../styles/form'

// 更新 server error のタグ分は BookmarkForm の summary へ混ぜず、タグ領域だけで表示する。
// タグ選択や新規作成といったタグ領域内の操作でだけ clear する意味を、
// 「BookmarkTagField が受け取って表示する」「タグ操作時に onClearServerError を呼ぶ」の
// 二点でコードに表現する。BookmarkForm を経由させると URL/title 側の入力変更でも
// Clear が発火してしまい、責務境界がぼやける。
export function ServerErrorNotice({ message }: { readonly message: string }) {
  return (
    <p
      className={fieldError}
      role='alert'>
      {message}
    </p>
  )
}
