#!/usr/bin/env bash
# Usage: scripts/smoke.sh email path1 path2 ...  — logs in and prints HTTP status per page
BASE=${BASE:-http://localhost:3000}
JAR=$(mktemp)
EMAIL=$1; shift
CSRF=$(curl -s -c "$JAR" "$BASE/api/auth/csrf" | sed -E 's/.*"csrfToken":"([^"]+)".*/\1/')
curl -s -b "$JAR" -c "$JAR" -o /dev/null -X POST "$BASE/api/auth/callback/credentials" \
  --data-urlencode "csrfToken=$CSRF" --data-urlencode "email=$EMAIL" --data-urlencode "password=password123"
for p in "$@"; do
  code=$(curl -s -b "$JAR" -o /tmp/smoke.html -w '%{http_code}' --max-time 180 "$BASE$p")
  err=$(grep -o 'Application error\|Unhandled Runtime Error\|__next_error__' /tmp/smoke.html | head -1)
  echo "$code $p $err"
done
rm -f "$JAR"
