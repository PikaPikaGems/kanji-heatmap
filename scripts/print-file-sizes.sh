#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

shopt -s nullglob

file_size_kb() {
  echo $(( $(wc -c <"$1" | tr -d " ") / 1024 ))
}

gzip_size_kb() {
  echo $(( $(gzip -9 -c "$1" | wc -c | tr -d " ") / 1024 ))
}

patterns=(
  raw-data/*.json
  public/json/*.json
  public/json/v2/*.json
  docs/data/*.json
)

echo "    raw      gz  path"
echo "  -----  ------  ----"

for pattern in "${patterns[@]}"; do
  for f in $pattern; do
    printf "%6sK %6sK  %s\n" \
      "$(file_size_kb "$f")" \
      "$(gzip_size_kb "$f")" \
      "$f"
  done
done | sort -k3

echo
echo "public/json/v2 totals (per-file gz sum — what goes over the wire):"

for f in public/json/v2/*.json; do
  gzip -9 -c "$f" | wc -c
done | awk '{ t += $1 } END { printf "%.0f KB gz total\n", t / 1024 }'

gzip -9 -c public/json/v2/kanji_main.json | wc -c |
  awk '{ printf "%.0f KB gz eager\n", $1 / 1024 }'
