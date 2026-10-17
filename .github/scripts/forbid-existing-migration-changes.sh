#!/usr/bin/env bash
# 既存のマイグレーションフォルダの中身が、PR で少しでも変わっていたら失敗する。
#
#   usage: forbid-existing-migration-changes.sh <base-sha> [<head>]
#
# 本番に適用済みのマイグレーションは追加・変更・削除・リネーム・型変更・コピー先を
# 問わず触らない。差分は新しいフォルダとして追加する（新しいフォルダは対象外）。
# base は PR が向いているブランチ（stacked PR では下の PR のブランチ）の先端。
# head は PR の先端でも、CI の merge ref（head を base へ merge した commit）でもよい。
#
# 検査は 2 つ:
#   1. merge-base にあったフォルダの中身が、merge-base...head の差分で変わっていない
#   2. base の先端と head の両方にあるフォルダは、tree が完全に一致する
# 1 の一覧を base の先端ではなく merge-base から取るのは、stack の下の PR が squash
# merge され、上の PR が rebase されずに main へ付け替えられたときに、下の PR が
# 追加したフォルダ（head の履歴にもある）を「既存への追加」と誤判定しないため。
# その代わり 2 で、base の先端にあるフォルダが head で別の中身になっていないかを見る。
# base の先端にあって head に無いフォルダ（head が main より古いだけ）は無視する。
set -euo pipefail

base=${1:?base sha is required}
head=${2:-HEAD}
root=packages/db/drizzle

merge_base=$(git merge-base "$base" "$head")

list_dirs() {
  git ls-tree -d --name-only "$1" "$root/"
}

violations=()

# 1. merge-base にあったフォルダ。--no-renames でリネームは削除 + 追加に分かれ、
#    移動元・移動先のどちらが既存フォルダでも捕まる。既存フォルダへのコピーも追加（A）
#    として捕まる。リネーム・コピー検出に頼らないので、前の snapshot とほぼ同じ新しい
#    snapshot を誤判定することもない。
mapfile -t existing_dirs < <(list_dirs "$merge_base")

in_existing_dir() {
  local path=$1 dir
  for dir in "${existing_dirs[@]}"; do
    if [[ "$path" == "$dir" || "$path" == "$dir"/* ]]; then
      return 0
    fi
  done
  return 1
}

while IFS=$'\t' read -r status path; do
  if in_existing_dir "$path"; then
    violations+=("$status	$path")
  fi
done < <(git diff --no-renames --name-status "$base...$head" -- "$root")

# 2. base の先端と head の両方にあるフォルダは tree が一致する。
mapfile -t head_dirs < <(list_dirs "$head")
declare -A in_head=()
for dir in "${head_dirs[@]}"; do
  in_head[$dir]=1
done

base_dirs=()
mapfile -t base_dirs < <(list_dirs "$base")
for dir in "${base_dirs[@]}"; do
  if [[ -z "${in_head[$dir]:-}" ]]; then
    continue
  fi
  if [[ "$(git rev-parse "$base:$dir")" != "$(git rev-parse "$head:$dir")" ]]; then
    violations+=("≠	$dir（base の先端と中身が異なる）")
  fi
done

if ((${#violations[@]} > 0)); then
  echo "::error::既存のマイグレーションは追加・変更・削除・リネームできません。変更は新しいマイグレーションとして追加してください。"
  printf '%s\n' "${violations[@]}"
  exit 1
fi

echo "既存のマイグレーション ${#existing_dirs[@]} 件（base の先端 ${#base_dirs[@]} 件）に変更はありません"
