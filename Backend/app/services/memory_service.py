from collections import deque

MAX_TURNS = 20
MAX_CHARS = 3000

class ConversationMemory:
    def __init__(self):
        self._history: deque[dict] = deque(maxlen=MAX_TURNS * 2)

    def add(self, role: str, content: str):
        self._history.append({"role": role, "content": content})
        self._trim()

    def get(self) -> list[dict]:
        return list(self._history)

    def _trim(self):
        while self._total_chars() > MAX_CHARS and len(self._history) > 2:
            self._history.popleft()
            if self._history:
                self._history.popleft()

    def _total_chars(self) -> int:
        return sum(len(m["content"]) for m in self._history)

memory = ConversationMemory()
