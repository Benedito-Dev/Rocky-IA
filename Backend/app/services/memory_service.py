from collections import deque
from app.repositories import memory_repository

MAX_TURNS = 20
MAX_CHARS = 3000

class ConversationMemory:
    def __init__(self):
        self._history: deque[dict] = deque(maxlen=MAX_TURNS * 2)
        for msg in memory_repository.load():
            self._history.append(msg)

    def add(self, role: str, content: str):
        saved = memory_repository.save_message(role, content, max_rows=MAX_TURNS * 2)
        if saved:
            self._history.append({"role": role, "content": content})
            self._trim()

    def get(self) -> list[dict]:
        return list(self._history)

    def _trim(self):
        while self._total_chars() > MAX_CHARS and len(self._history) > 2:
            self._history.popleft()
            self._history.popleft()
            memory_repository.trim_oldest(2)

    def _total_chars(self) -> int:
        return sum(len(m["content"]) for m in self._history)

memory = ConversationMemory()
