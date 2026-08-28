#!/usr/bin/env bash
# Docker デーモンが既に起動している状態で start-libsql.sh が成功することを検証する。
set -euo pipefail

cd "$(dirname "$0")/.."

if ! docker info >/dev/null 2>&1; then
  echo "docker info が失敗したため、このテストは実行できません。" >&2
  exit 1
fi

if ! bash .cursor/start-libsql.sh; then
  echo "Docker 起動済みなのに start-libsql.sh が失敗しました。" >&2
  exit 1
fi

if ! curl --fail --silent http://127.0.0.1:8080/v2 >/dev/null; then
  echo "start-libsql.sh 成功後も LibSQL の /v2 が応答しません。" >&2
  exit 1
fi
