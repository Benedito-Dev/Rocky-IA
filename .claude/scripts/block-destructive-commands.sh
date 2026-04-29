#!/bin/bash
# block-destructive-commands.sh — Rocky-IA
# PreToolUse hook que bloqueia comandos destrutivos em Bash
#
# Exit 2 = bloqueia comando
# Exit 0 = permite comando

set -euo pipefail

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

if [ -z "$COMMAND" ]; then
  exit 0
fi

# =====================================================================
# 1. SQLite destrutivo — memory.db contem conversas do usuario
# =====================================================================
if echo "$COMMAND" | grep -iE '\bDROP\s+TABLE\b' > /dev/null; then
  echo "BLOQUEADO: DROP TABLE detectado! memory.db contem conversas do usuario." >&2
  exit 2
fi

if echo "$COMMAND" | grep -iE '\bTRUNCATE\b' > /dev/null; then
  echo "BLOQUEADO: TRUNCATE detectado! Apagaria toda a memoria conversacional." >&2
  exit 2
fi

if echo "$COMMAND" | grep -iE 'rm\s+(-rf|-fr|-f)\s+.*memory\.db' > /dev/null; then
  echo "BLOQUEADO: Tentativa de deletar memory.db!" >&2
  echo "memory.db contem o historico de conversas do usuario." >&2
  exit 2
fi

# =====================================================================
# 2. Filesystem destrutivo
# =====================================================================
if echo "$COMMAND" | grep -iE 'rm\s+(-rf|-fr)\s+(/|~|Backend/app/|Frontend/src/|\.claude/|workspace/)' > /dev/null; then
  echo "BLOQUEADO: rm -rf em diretorio critico detectado!" >&2
  exit 2
fi

if echo "$COMMAND" | grep -iE 'rm\s+(-rf|-fr)\s+\.git' > /dev/null; then
  echo "BLOQUEADO: rm -rf .git detectado! Isso apaga todo historico!" >&2
  exit 2
fi

# =====================================================================
# 3. Git destrutivo
# =====================================================================
if echo "$COMMAND" | grep -iE 'git\s+push\s+.*--force.*\b(main|master)\b' > /dev/null; then
  echo "BLOQUEADO: git push --force em main/master!" >&2
  exit 2
fi

# =====================================================================
# 4. Publicacao acidental
# =====================================================================
if echo "$COMMAND" | grep -iE 'npm\s+publish' > /dev/null; then
  echo "BLOQUEADO: npm publish requer revisao manual." >&2
  exit 2
fi

# =====================================================================
# 5. Producao acidental (se variaveis de prod estiverem presentes)
# =====================================================================
if echo "$COMMAND" | grep -iE 'NODE_ENV=production.*rm|rm.*NODE_ENV=production' > /dev/null; then
  echo "BLOQUEADO: Comando destrutivo em contexto de producao!" >&2
  exit 2
fi

# =====================================================================
# COMANDO PERMITIDO
# =====================================================================
exit 0
