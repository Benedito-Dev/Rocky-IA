#!/bin/bash
# validate-review.sh — Rocky-IA
# Stop hook para o agent Reviewer

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "Validando review do Reviewer..."

REVIEW_DIR="workspace/reviews"

if [ ! -d "$REVIEW_DIR" ]; then
  echo -e "${RED}ERRO: diretorio workspace/reviews/ nao existe!${NC}" >&2
  exit 2
fi

LATEST_REVIEW=$(find "$REVIEW_DIR" -name "review-*.md" -type f -print0 2>/dev/null | xargs -0 ls -t 2>/dev/null | head -1)

if [ -z "$LATEST_REVIEW" ]; then
  echo -e "${RED}ERRO: Review nao encontrada em workspace/reviews/${NC}" >&2
  exit 2
fi

REVIEW_FILENAME=$(basename "$LATEST_REVIEW")
echo -e "${GREEN}OK${NC} Review encontrada: $REVIEW_FILENAME"

if ! echo "$REVIEW_FILENAME" | grep -qE '^review-[a-z0-9]+-[a-z0-9-]+-task[0-9]+\.md$'; then
  echo -e "${RED}ERRO: Nomenclatura incorreta: $REVIEW_FILENAME${NC}" >&2
  exit 2
fi

REVIEW_CONTENT=$(cat "$LATEST_REVIEW")

SCORE=$(echo "$REVIEW_CONTENT" | grep -oE '[0-9]+\.?[0-9]*/10' | head -1 || echo "")

if [ -z "$SCORE" ]; then
  echo -e "${RED}ERRO: Score numerico nao encontrado!${NC}" >&2
  exit 2
fi

echo -e "${GREEN}OK${NC} Score: $SCORE"

DECISION=""
if echo "$REVIEW_CONTENT" | grep -qi "APPROVED"; then
  DECISION="APPROVED"
elif echo "$REVIEW_CONTENT" | grep -qi "REJECTED"; then
  DECISION="REJECTED"
elif echo "$REVIEW_CONTENT" | grep -qi "NEEDS.CHANGE\|NEEDS_CHANGE"; then
  DECISION="NEEDS_CHANGES"
fi

if [ -z "$DECISION" ]; then
  echo -e "${RED}ERRO: Decisao nao encontrada (APPROVED/REJECTED/NEEDS_CHANGES)!${NC}" >&2
  exit 2
fi

echo -e "${GREEN}OK${NC} Decisao: $DECISION"

SCORE_VALUE=$(echo "$SCORE" | grep -oE '^[0-9]+\.?[0-9]*' || echo "0")

if [ "$DECISION" = "APPROVED" ] && (( $(echo "$SCORE_VALUE < 7.0" | bc -l) )); then
  echo -e "${RED}ERRO: APPROVED com score $SCORE_VALUE < 7.0!${NC}" >&2
  exit 2
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}VALIDACOES DA REVIEW PASSARAM!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
exit 0
