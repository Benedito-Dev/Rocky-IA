from pydantic import BaseModel


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    response: str


class FactItem(BaseModel):
    fact: str
    category: str


class SummarizeResponse(BaseModel):
    facts_saved: int
    facts: list[FactItem]
