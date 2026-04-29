#!/bin/bash
# validate-plan.sh — Rocky-IA
# Stop hook para o agent Strategist

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "Validando plano do Strategist..."

PLAN_DIR="workspace/plans"

if [ ! -d "$PLAN_DIR" ]; then
  echo -e "${RED}ERRO: diretorio workspace/plans/ nao existe!${NC}" >&2
  exit 2
fi

LATEST_PLAN=$(find "$PLAN_DIR" -name "plan-*.md" -type f -print0 2>/dev/null | xargs -0 ls -t 2>/dev/null | head -1)

if [ -z "$LATEST_PLAN" ]; then
  echo -e "${RED}ERRO: Nenhum plan-*.md encontrado em workspace/plans/${NC}" >&2
  exit 2
fi

echo -e "${GREEN}OK${NC} Plano encontrado: $(basename "$LATEST_PLAN")"

FILENAME=$(basename "$LATEST_PLAN")

if ! echo "$FILENAME" | grep -qE '^plan-[a-z0-9]+-[a-z0-9-]+-task[0-9]+\.md$'; then
  echo -e "${RED}ERRO: Nomenclatura incorreta: $FILENAME${NC}" >&2
  echo -e "${YELLOW}Formato esperado: plan-[modulo]-[descricao]-taskN.md${NC}" >&2
  exit 2
fi

echo -e "${GREEN}OK${NC} Nomenclatura correta: $FILENAME"

MIN_LINES=50
LINE_COUNT=$(wc -l < "$LATEST_PLAN")

if [ "$LINE_COUNT" -lt "$MIN_LINES" ]; then
  echo -e "${RED}ERRO: Plano muito curto: $LINE_COUNT linhas (minimo: $MIN_LINES)${NC}" >&2
  exit 2
fi

echo -e "${GREEN}OK${NC} Tamanho adequado: $LINE_COUNT linhas"

CONTENT=$(cat "$LATEST_PLAN")

if ! echo "$CONTENT" | grep -qi "alternativa\|option\|approach"; then
  echo -e "${YELLOW}AVISO: Plano pode nao conter analise de alternativas${NC}" >&2
fi

if ! echo "$CONTENT" | grep -qi "risco\|risk"; then
  echo -e "${YELLOW}AVISO: Plano pode nao conter analise de riscos${NC}" >&2
fi

echo ""
echo -e "${GREEN}Todas as validacoes do plano passaram!${NC}"
echo ""
exit 0
