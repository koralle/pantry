#!/usr/bin/env bash
# base に既にあるマイグレーションフォルダの中身が、PR で少しでも変わっていたら失敗する。
#
#   usage: forbid-existing-migration-changes.sh <base-sha> [<head>]
#
# 本番に適用済みのマイグレーションは追加・変更・削除・リネーム・型変更・コピー先を
# 問わず触らない。差分は新しいフォルダとして追加する（新しいフォルダは対象外）。
# base は PR が向いているブランチ（stacked PR では下の PR のブランチ）の先端。
set -euo pipefail

base=${1:?base sha is required}
head=${2:-HEAD}
root=packages/db/drizzle

# base に存在したフォルダ（packages/db/drizzle/<name>）。
mapfile -t base_dirs < <(git ls-tree -d --name-only "$base" "$root/")

in_base_dir() {
  local path=$1 dir
  for dir in "${base_dirs[@]}"; do
    if [[ "$path" == "$dir" || "$path" == "$dir"/* ]]; then
      return 0
    fi
  done
  return 1
}

violations=()
# フィルタなしで全種類の変更（A / M / D / T）を取る。--no-renames でリネームは
# 削除 + 追加に分かれるので、移動元・移動先のどちらが既存フォルダでも捕まる。
# 既存フォルダへのコピーも追加（A）として捕まる。リネーム・コピー検出に頼らないので、
# 前の snapshot とほぼ同じ新しい snapshot を誤判定することもない。
while IFS=$'\t' read -r status path; do
  if in_base_dir "$path"; then
    violations+=("$status	$path")
  fi
done < <(git diff --no-renames --name-status "$base...$head" -- "$root")

if ((${#violations[@]} > 0)); then
  echo "::error::既存のマイグレーションは追加・変更・削除・リネームできません。変更は新しいマイグレーションとして追加してください。"
  printf '%s\n' "${violations[@]}"
  exit 1
fi

echo "既存のマイグレーション ${#base_dirs[@]} 件に変更はありません"
