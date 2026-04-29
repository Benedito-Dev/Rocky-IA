---
name: ESLint react-hooks bloqueia atribuição a ref durante render e dependência circular
description: Dois padrões que o ESLint do projeto bloqueia em hooks React
type: feedback
---

**Regra 1:** Atribuição a `ref.current` durante render é bloqueada por `react-hooks/refs`.
Usar `useEffect` para manter a ref atualizada:
```js
useEffect(() => { myRef.current = myCallback; }, [myCallback]);
```

**Regra 2:** Dependência circular entre dois `useCallback` (A chama B, B chama A) gera erro `Cannot access variable before it is declared`.
Solução: um dos dois usa a ref do outro via `myRef.current?.()` em vez de chamar diretamente.

**Why:** O ESLint do projeto usa `react-hooks/immutability` e `react-hooks/refs` além do `exhaustive-deps` padrão.

**How to apply:** Sempre que dois callbacks se referenciam mutuamente, usar o padrão ref-via-useEffect para o que for declarado depois.
