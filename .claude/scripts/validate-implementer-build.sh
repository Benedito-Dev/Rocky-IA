#!/bin/bash
# validate-implementer-build.sh — Rocky-IA
# SubagentStop hook para o Implementer

set -euo pipefail

cat > /dev/null 2>&1 || true

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

echo "Double-check: validando build do Implementer (Rocky-IA)..." >&2

# =====================================================================
# VALIDACAO 1: Frontend build
# =====================================================================
if [ -d "Frontend" ] && [ -f "Frontend/package.json" ]; then
  if ! (cd Frontend && npm run build > /tmp/subagent-build-check.log 2>&1); then
    echo -e "${RED}Frontend build FALHOU no double-check!${NC}" >&2
    tail -10 /tmp/subagent-build-check.log >&2

    ERRMSG=$(tail -5 /tmp/subagent-build-check.log | tr '\n' ' ' | sed 's/"/\\"/g')
    cat <<EOF
{
  "decision": "block",
  "reason": "Frontend build FALHOU. Implementer precisa corrigir antes de retornar. Erro: ${ERRMSG}"
}
EOF
    exit 0
  fi
  echo -e "${GREEN}Double-check: Frontend build OK${NC}" >&2
fi

# =====================================================================
# VALIDACAO 2: Implementation notes existem
# =====================================================================
IMPL_DIR="workspace/implementations"
LATEST_IMPL=""
if [ -d "$IMPL_DIR" ]; then
  LATEST_IMPL=$(find "$IMPL_DIR" -name "impl-*.md" -type f -print0 2>/dev/null | xargs -0 ls -t 2>/dev/null | head -1 || true)
fi

if [ -z "${LATEST_IMPL:-}" ]; then
  cat <<EOF
{
  "decision": "block",
  "reason": "Implementation notes nao encontradas em workspace/implementations/. Implementer precisa criar impl-[modulo]-[desc]-taskN.md antes de retornar."
}
EOF
  exit 0
fi

echo -e "${GREEN}Double-check: Implementation notes OK${NC}" >&2
echo -e "${GREEN}Double-check COMPLETO: Implementer pode retornar.${NC}" >&2
exit 0
