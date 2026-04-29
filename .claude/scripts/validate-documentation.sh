#!/bin/bash
# validate-documentation.sh — Rocky-IA
# Stop hook para o agent Documenter

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "Validando documentacao Rocky-IA..."

# ==============================================================================
# OBTER TASK NUMBER
# ==============================================================================

TASK_NUM="${TASK_NUM:-}"

if [ -z "$TASK_NUM" ]; then
  for search_dir in workspace/implementations workspace/reviews workspace/plans; do
    if [ -d "$search_dir" ]; then
      LATEST_ARTIFACT=$(find "$search_dir" -name "*-task*.md" -type f -print0 2>/dev/null | xargs -0 ls -t 2>/dev/null | head -1)
      if [ -n "${LATEST_ARTIFACT:-}" ]; then
        TASK_NUM=$(basename "$LATEST_ARTIFACT" | grep -oE 'task[0-9]+' | grep -oE '[0-9]+' || echo "")
        if [ -n "$TASK_NUM" ]; then break; fi
      fi
    fi
  done
fi

if [ -z "$TASK_NUM" ]; then
  TASK_NUM="UNKNOWN"
fi

echo -e "${GREEN}OK${NC} Task Number: $TASK_NUM"

# ==============================================================================
# VALIDACAO 1: STATUS.md atualizado (CRITICO!)
# ==============================================================================

STATUS_FILE="workspace/STATUS.md"

if [ ! -f "$STATUS_FILE" ]; then
  echo -e "${RED}ERRO: $STATUS_FILE nao encontrado!${NC}" >&2
  exit 2
fi

if [ "$TASK_NUM" != "UNKNOWN" ]; then
  if ! grep -qE "Task ${TASK_NUM}" "$STATUS_FILE"; then
    echo -e "${RED}ERRO: Task $TASK_NUM NAO encontrada no STATUS.md!${NC}" >&2
    exit 2
  fi

  if ! grep -qE "Task ${TASK_NUM}.*COMPLETE|COMPLETA" "$STATUS_FILE"; then
    echo -e "${RED}ERRO: Task $TASK_NUM existe mas nao esta marcada como COMPLETE!${NC}" >&2
    exit 2
  fi

  echo -e "${GREEN}OK${NC} Task $TASK_NUM documentada no STATUS.md"
fi

# ==============================================================================
# VALIDACAO 2: CHANGELOG.md
# ==============================================================================

CHANGELOG_FILE=""
for candidate in "CHANGELOG.md" "docs/CHANGELOG.md"; do
  if [ -f "$candidate" ]; then
    CHANGELOG_FILE="$candidate"
    break
  fi
done

if [ -z "$CHANGELOG_FILE" ]; then
  echo -e "${YELLOW}INFO: CHANGELOG.md nao encontrado (opcional)${NC}"
else
  if ! grep -q "## \[Unreleased\]" "$CHANGELOG_FILE"; then
    echo -e "${YELLOW}AVISO: CHANGELOG sem secao [Unreleased]${NC}" >&2
  else
    echo -e "${GREEN}OK${NC} CHANGELOG atualizado"
  fi
fi

# ==============================================================================
# VALIDACAO 3: Git commit
# ==============================================================================

if git rev-parse --git-dir > /dev/null 2>&1; then
  LAST_COMMIT=$(git log -1 --oneline 2>/dev/null || echo "")

  if [ -z "$LAST_COMMIT" ]; then
    echo -e "${RED}ERRO: Nenhum commit encontrado!${NC}" >&2
    exit 2
  fi

  echo "Ultimo commit: $LAST_COMMIT"

  if ! echo "$LAST_COMMIT" | grep -qE '^[a-f0-9]+ (feat|fix|docs|refactor|perf|test|chore|style|ci|build)(\([a-z0-9-]+\))?:'; then
    echo -e "${YELLOW}AVISO: Commit pode nao seguir Conventional Commits${NC}" >&2
  fi

  echo -e "${GREEN}OK${NC} Git commit existe"
fi

# ==============================================================================
# SUCESSO
# ==============================================================================

echo ""
echo -e "${GREEN}==============================================${NC}"
echo -e "${GREEN}VALIDACOES DE DOCUMENTACAO PASSARAM!${NC}"
echo -e "${GREEN}==============================================${NC}"
echo ""
exit 0
