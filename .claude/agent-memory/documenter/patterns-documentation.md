---
name: Padrões de Documentação Rocky-IA
description: Docstrings Python/React, STATUS.md (timeline), CHANGELOG.md (Keep a Changelog)
type: feedback
---

## STATUS.md Template
Estrutura adotada para rastrear tasks completas:
- **Module:** área afetada (frontend, backend, etc)
- **Task:** descrição breve
- **Status:** COMPLETA
- **Date:** YYYY-MM-DD
- **Duration:** tempo total gasto
- **Quality Score:** X/10 do Reviewer
- **Deliverables:** lista checklist de entregáveis
- **Metrics:** Frontend build, ESLint, Backend status

**Why:** Hook de validação em STATUS.md, essencial para rastreamento de tasks

## CHANGELOG.md Template
Usa [Keep a Changelog](https://keepachangelog.com):
- Seção [Unreleased] para features em desenvolvimento
- Subseções: Added, Fixed, Changed, Deprecated, Removed, Security
- Cada item: `- **[Area]** (Task N) descrição curta`

**Why:** Padrão internacional, fácil versioning na hora do release

## Docstrings (Python)
Estilo Google:
```python
def speak(message: str) -> dict:
    """Descrição breve.
    
    Args:
        message: descrição do arg
    
    Returns:
        dict com chaves...
    
    Raises:
        HTTPException: quando...
    """
```

**Why:** Padrão do projeto, compatível com autogeração de docs

## JSDoc (React)
Tipado em @param para props principais:
```javascript
/**
 * Orb animada com 4 estados.
 * 
 * @param {Object} props
 * @param {'idle'|'listening'|'thinking'|'speaking'} props.state - Estado atual
 */
export function Orb({ state }) { ... }
```

**Why:** Documentação legível, integra com IDE
