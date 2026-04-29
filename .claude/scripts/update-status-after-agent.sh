#!/bin/bash
# update-status-after-agent.sh — Rocky-IA
# SubagentStop hook — atualiza workspace/STATUS.md quando agent termina

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

AGENT_NAME="${1:-}"

if [ -z "$AGENT_NAME" ] && [ ! -t 0 ]; then
  STDIN_DATA=$(cat)
  if [ -n "$STDIN_DATA" ] && command -v jq &>/dev/null; then
    AGENT_NAME=$(echo "$STDIN_DATA" | jq -r '.agent_type // .subagent_type // empty' 2>/dev/null || true)
  fi
fi

if [ -z "$AGENT_NAME" ]; then
  echo -e "${YELLOW}AVISO: Nome do agent nao identificado — pulando update${NC}"
  exit 0
fi

case "$AGENT_NAME" in
  strategist|implementer|reviewer|documenter) ;;
  *)
    echo -e "${YELLOW}AVISO: Agent '$AGENT_NAME' nao faz parte do workflow — pulando${NC}"
    exit 0
    ;;
esac

TASK_NUM=""
for dir in workspace/implementations workspace/reviews workspace/plans; do
  if [ -d "$dir" ]; then
    LATEST_FILE=$(find "$dir" -name "*-task*.md" -type f -print0 2>/dev/null | xargs -0 ls -t 2>/dev/null | head -1)
    if [ -n "${LATEST_FILE:-}" ]; then
      TASK_NUM=$(basename "$LATEST_FILE" | grep -oE 'task[0-9]+' | sed 's/task//' || echo "")
      if [ -n "$TASK_NUM" ]; then break; fi
    fi
  fi
done

if [ -z "$TASK_NUM" ]; then
  TASK_NUM="unknown"
fi

STATUS_FILE="workspace/STATUS.md"

if [ ! -f "$STATUS_FILE" ]; then
  mkdir -p workspace
  cat > "$STATUS_FILE" << 'EOF'
# Workflow Status - Rocky-IA

**Projeto:** Rocky-IA
**Ultima atualizacao:** Auto-gerado por hooks

---

## Tasks Concluidas

(Conclusao dos agents sera registrada abaixo automaticamente)

EOF
fi

TIMESTAMP_LOCAL=$(date +"%d/%m/%Y %H:%M:%S")
FINGERPRINT="<!-- dedup:${AGENT_NAME}:${TASK_NUM} -->"

if grep -qF "$FINGERPRINT" "$STATUS_FILE" 2>/dev/null; then
  echo -e "${YELLOW}AVISO: Entry duplicado (${AGENT_NAME}, Task #${TASK_NUM}) — pulando${NC}"
  exit 0
fi

cat >> "$STATUS_FILE" << EOF

---

${FINGERPRINT}
### Agent Concluido: $AGENT_NAME

**Task:** #$TASK_NUM
**Timestamp:** $TIMESTAMP_LOCAL
**Agent:** $AGENT_NAME
**Status:** Concluido

EOF

echo -e "${GREEN}OK${NC} STATUS.md atualizado — $AGENT_NAME (Task #$TASK_NUM)"
exit 0
