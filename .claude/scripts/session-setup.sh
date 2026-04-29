#!/bin/bash
# session-setup.sh — Rocky-IA
# SessionStart hook — verifica pre-requisitos ao iniciar a sessao

set -euo pipefail

ERRORS=0
WARNINGS=0
CONTEXT=""

# =====================================================================
# CHECK 1: Python instalado
# =====================================================================
if ! command -v python &>/dev/null && ! command -v python3 &>/dev/null; then
  CONTEXT+="ERROR: Python nao encontrado. Instale Python 3.x.\n"
  ERRORS=$((ERRORS + 1))
else
  PYTHON_VERSION=$(python --version 2>/dev/null || python3 --version 2>/dev/null)
  CONTEXT+="Python: $PYTHON_VERSION\n"
fi

# =====================================================================
# CHECK 2: Node.js instalado (para o Frontend)
# =====================================================================
if ! command -v node &>/dev/null; then
  CONTEXT+="WARNING: Node.js nao encontrado (necessario para o Frontend).\n"
  WARNINGS=$((WARNINGS + 1))
else
  NODE_VERSION=$(node --version)
  CONTEXT+="Node.js: $NODE_VERSION\n"
fi

# =====================================================================
# CHECK 3: Backend — requirements e venv
# =====================================================================
if [ -d "Backend" ]; then
  if [ -f "Backend/requirements.txt" ]; then
    CONTEXT+="Backend/requirements.txt: OK\n"
  else
    CONTEXT+="WARNING: Backend/requirements.txt nao encontrado.\n"
    WARNINGS=$((WARNINGS + 1))
  fi

  if [ ! -d "Backend/venv" ] && [ ! -d "Backend/.venv" ]; then
    CONTEXT+="INFO: Sem venv no Backend (pode estar usando env global).\n"
  else
    CONTEXT+="Backend venv: OK\n"
  fi
fi

# =====================================================================
# CHECK 4: Backend .env
# =====================================================================
if [ -f "Backend/.env.example" ]; then
  if [ ! -f "Backend/.env" ]; then
    CONTEXT+="WARNING: Backend/.env nao existe. Copie .env.example e configure as API keys.\n"
    WARNINGS=$((WARNINGS + 1))
  else
    CONTEXT+="Backend/.env: OK\n"
  fi
fi

# =====================================================================
# CHECK 5: Frontend node_modules
# =====================================================================
if [ -d "Frontend" ]; then
  if [ ! -d "Frontend/node_modules" ]; then
    CONTEXT+="WARNING: Frontend/node_modules nao encontrado. Rode 'cd Frontend && npm install'.\n"
    WARNINGS=$((WARNINGS + 1))
  else
    CONTEXT+="Frontend/node_modules: OK\n"
  fi
fi

# =====================================================================
# CHECK 6: Git branch
# =====================================================================
BRANCH=$(git branch --show-current 2>/dev/null || echo "(sem git)")
CONTEXT+="Git branch: $BRANCH\n"

# =====================================================================
# CHECK 7: Arquivos modificados
# =====================================================================
if git rev-parse --git-dir > /dev/null 2>&1; then
  MODIFIED=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
  CONTEXT+="Arquivos modificados: $MODIFIED\n"
fi

# =====================================================================
# CHECK 8: workspace/
# =====================================================================
if [ ! -d "workspace" ]; then
  CONTEXT+="WARNING: workspace/ nao existe. Agents multi-agent precisam dele.\n"
  WARNINGS=$((WARNINGS + 1))
else
  CONTEXT+="workspace/: OK\n"
fi

# =====================================================================
# CHECK 9: CLAUDE.md
# =====================================================================
if [ ! -f "CLAUDE.md" ]; then
  CONTEXT+="INFO: CLAUDE.md nao existe. Recomendado criar para padroes do projeto.\n"
fi

# =====================================================================
# OUTPUT
# =====================================================================
echo "=== Rocky-IA Session Setup ==="
echo -e "$CONTEXT"

if [ "$ERRORS" -gt 0 ]; then
  echo "RESULTADO: $ERRORS erros, $WARNINGS warnings"
  echo "Corrija erros antes de comecar."
else
  echo "RESULTADO: Ambiente OK ($WARNINGS warnings)"
fi

exit 0
