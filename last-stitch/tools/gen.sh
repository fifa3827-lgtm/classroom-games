#!/bin/bash
# Codex로 그림 한 장 뽑기. 사용: bash gen.sh 지시문.txt 결과.png 첨부1.png [첨부2.png ...]
# 디펜스게임 폴더에서 실행. 결과가 없으면 'FAIL' 출력하고 종료코드 1.
set -u
PROMPT="$1"; OUT="$2"; shift 2
ARGS=()
for f in "$@"; do ARGS+=(-i "$f"); done
LOG=$(mktemp)
codex exec --skip-git-repo-check -s read-only -C . "${ARGS[@]}" - < "$PROMPT" > "$LOG" 2>&1
SID=$(grep -m1 'session id:' "$LOG" | awk '{print $3}' | tr -d '\r')
DIR="$HOME/.codex/generated_images/$SID"
IMG=$(ls -t "$DIR"/*.png 2>/dev/null | head -1)
if [ -z "$SID" ] || [ -z "$IMG" ]; then
  echo "FAIL $OUT (session=$SID)"; tail -5 "$LOG"; exit 1
fi
mkdir -p "$(dirname "$OUT")"
cp "$IMG" "$OUT"
echo "OK $OUT <- $IMG"
