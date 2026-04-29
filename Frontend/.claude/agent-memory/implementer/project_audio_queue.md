---
name: Fila de áudio com AudioBufferSourceNode no ChatScreen
description: Padrão para fila de chunks de áudio sem gap usando AudioContext + AudioBufferSourceNode + ref circular
type: project
---

Para tocar chunks de áudio em sequência sem gap, o ChatScreen usa:
- `audioQueueRef`: fila de `ArrayBuffer` (não `Blob`/`URL` — evita leak)
- `streamCtxRef`: `AudioContext` único reutilizado para toda a sessão de streaming
- `playNextInQueueRef`: ref que guarda a função `playNextInQueue` para quebrar dependência circular com `enqueueAudio`
- `isPlayingQueueRef`: flag bool para evitar reprodução paralela

`decodeAudioData` exige que o `ArrayBuffer` seja clonado antes de enfileirar (`bytes.buffer.slice(0)`) pois a API transfere a propriedade do buffer.

**Why:** `AudioBufferSourceNode` não tem gap entre chunks quando o `AudioContext` é o mesmo. Criar um novo `AudioContext` por chunk causa aviso do browser e latência de inicialização.

**How to apply:** Sempre usar `streamCtxRef` único por sessão. Fechar o contexto apenas quando a fila esvazia após `done` ou em `stopStream`.
