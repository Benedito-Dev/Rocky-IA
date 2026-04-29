#!/bin/bash
# validate-implementation.sh — Rocky-IA
# Stop hook para o agent Implementer

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "Validando implementacao Rocky-IA..."

# ==============================================================================
# VALIDACAO 1: Frontend build (se Frontend/ existe)
# ==============================================================================

if [ -d "Frontend" ] && [ -f "Frontend/package.json" ]; then
  echo ""
  echo "Rodando Frontend build..."

  if ! (cd Frontend && npm run build > /tmp/frontend-build.log 2>&1); then
    echo -e "${RED}ERRO: Frontend build FALHOU!${NC}" >&2
    tail -20 /tmp/frontend-build.log >&2
    exit 2
  fi

  echo -e "${GREEN}Frontend build: PASSOU!${NC}"
else
  echo -e "${YELLOW}INFO: Frontend/ nao encontrado — pulando build${NC}"
fi

# ==============================================================================
# VALIDACAO 2: Frontend ESLint (se configurado)
# ==============================================================================

if [ -d "Frontend" ] && [ -f "Frontend/eslint.config.js" ]; then
  echo ""
  echo "Rodando ESLint..."

  ESLINT_OUTPUT=$(cd Frontend && npx eslint src/ --format json 2>/dev/null || echo "[]")
  ERROR_COUNT=$(echo "$ESLINT_OUTPUT" | jq '[.[] | .errorCount] | add // 0' 2>/dev/null || echo 0)
  WARNING_COUNT=$(echo "$ESLINT_OUTPUT" | jq '[.[] | .warningCount] | add // 0' 2>/dev/null || echo 0)

  if [ "$ERROR_COUNT" -gt 0 ]; then
    echo -e "${RED}ERRO: ESLint encontrou $ERROR_COUNT erros!${NC}" >&2
    (cd Frontend && npx eslint src/) >&2 || true
    exit 2
  fi

  echo -e "${GREEN}OK${NC} ESLint: $ERROR_COUNT erros, $WARNING_COUNT warnings"
fi

# ==============================================================================
# VALIDACAO 3: Backend — sintaxe Python (verificacao rapida)
# ==============================================================================

if [ -d "Backend/app" ]; then
  echo ""
  echo "Verificando sintaxe Python..."

  PYTHON_CMD="python"
  if ! command -v python &>/dev/null; then
    PYTHON_CMD="python3"
  fi

  SYNTAX_ERRORS=0
  while IFS= read -r -d '' py_file; do
    if ! $PYTHON_CMD -m py_compile "$py_file" 2>/dev/null; then
      echo -e "${RED}ERRO de sintaxe Python: $py_file${NC}" >&2
      SYNTAX_ERRORS=$((SYNTAX_ERRORS + 1))
    fi
  done < <(find Backend/app -name "*.py" -type f -print0)

  if [ "$SYNTAX_ERRORS" -gt 0 ]; then
    echo -e "${RED}ERRO: $SYNTAX_ERRORS arquivos Python com erros de sintaxe!${NC}" >&2
    exit 2
  fi

  echo -e "${GREEN}OK${NC} Sintaxe Python: sem erros"
fi

# ==============================================================================
# VALIDACAO 4: Secrets hardcoded (segurança critica)
# ==============================================================================

echo ""
echo "Verificando secrets hardcoded..."

if grep -rn "gsk_\|xi_api_key\|ElevenLabs.*=.*['\"][a-zA-Z0-9]\{20,\}" Backend/app/ 2>/dev/null; then
  echo -e "${RED}ERRO: Possivel API key hardcoded encontrada!${NC}" >&2
  exit 2
fi

echo -e "${GREEN}OK${NC} Nenhuma API key hardcoded detectada"

# ==============================================================================
# VALIDACAO 5: Implementation notes existem
# ==============================================================================

echo ""
echo "Verificando implementation notes..."

IMPL_DIR="workspace/implementations"

LATEST_IMPL=$(find "$IMPL_DIR" -name "impl-*.md" -type f -print0 2>/dev/null | xargs -0 ls -t 2>/dev/null | head -1)

if [ -z "$LATEST_IMPL" ]; then
  echo -e "${RED}ERRO: Implementation notes nao encontradas!${NC}" >&2
  echo -e "${YELLOW}Crie: workspace/implementations/impl-[modulo]-[descricao]-taskN.md${NC}" >&2
  exit 2
fi

IMPL_FILENAME=$(basename "$LATEST_IMPL")

if ! echo "$IMPL_FILENAME" | grep -qE '^impl-[a-z0-9]+-[a-z0-9-]+-task[0-9]+\.md$'; then
  echo -e "${RED}ERRO: Nomenclatura incorreta: $IMPL_FILENAME${NC}" >&2
  exit 2
fi

echo -e "${GREEN}OK${NC} Implementation notes: $IMPL_FILENAME"

# ==============================================================================
# SUCESSO
# ==============================================================================

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}TODAS AS VALIDACOES PASSARAM!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
exit 0
