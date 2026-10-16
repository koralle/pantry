#!/usr/bin/env bash
# Read bookmark rows for one URL from the verification database only.
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "usage: query-url.sh <url>" >&2
  exit 1
fi

url=$1
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
ROOT=$(cd "$SCRIPT_DIR/../../../.." && pwd)
cd "$ROOT"

node --input-type=module -e '
import { createClient } from "@libsql/client";
const url = process.argv[1];
const client = createClient({
  url: "http://127.0.0.1:18080",
  authToken: "pantry-verify-token",
});
const result = await client.execute({
  sql: "select id, title, url from bookmarks where url = ?",
  args: [url],
});
console.log(JSON.stringify(result.rows));
' "$url"
