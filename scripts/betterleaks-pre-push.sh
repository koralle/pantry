#!/bin/sh
# pre-push で push する commit だけを betterleaks に渡す。
#
# 全履歴を走査すると、main に既に入っているテスト用の固定パスワードのような
# 過去の finding で毎回 push が止まる。Git は pre-push hook の stdin に
# `<local ref> <local sha> <remote ref> <remote sha>` を渡すので、その範囲だけを見る。
set -eu

cd "$(git rev-parse --show-toplevel)"

status=0
scanned=""
seen_ref=0

scan() {
  log_opts=$1

  # `--not --remotes=origin` を含む場合があるため、ここでは意図的に分割する。
  # shellcheck disable=SC2086
  if [ -z "$(git rev-list --max-count=1 $log_opts 2>/dev/null)" ]; then
    return 0
  fi

  case " $scanned " in
    *" $log_opts "*) return 0 ;;
  esac
  scanned="$scanned $log_opts"

  if ! betterleaks git . --log-opts="$log_opts" --no-banner -v; then
    status=1
  fi
}

# 手動実行や stdin が空の場合は、origin/main からの差分を見る。
scan_fallback() {
  if git rev-parse --verify --quiet origin/main >/dev/null; then
    scan "origin/main..HEAD"
  fi
}

while read -r _local_ref local_sha _remote_ref remote_sha; do
  case "$local_sha" in
    # ブランチ削除。走査する commit がない。
    0000000000000000000000000000000000000000) continue ;;
  esac

  seen_ref=1

  case "$remote_sha" in
    # 新しい remote ref。どの remote にもない commit だけを見る。
    0000000000000000000000000000000000000000)
      scan "$local_sha --not --remotes=origin"
      ;;
    *)
      scan "$remote_sha..$local_sha"
      ;;
  esac
done

if [ "$seen_ref" -eq 0 ]; then
  scan_fallback
fi

exit "$status"
