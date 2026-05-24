from abc import ABC, abstractmethod
import os
from typing import Optional
from anthropic import Anthropic
from dotenv import load_dotenv


load_dotenv()


class LLMProvider(ABC):
    @abstractmethod
    def complete(self, system: str, user: str) -> str: ...


class ClaudeProvider(LLMProvider):
    def __init__(self, model: Optional[str] = None):
        self.client = Anthropic()
        self.model = model or os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-6")

    def complete(self, system: str, user: str) -> str:
        resp = self.client.messages.create(
            model=self.model,
            max_tokens=4096,
            system=system,
            messages=[{"role": "user", "content": user}],
        )
        return resp.content[0].text


def get_provider(name: str = "claude") -> LLMProvider:
    if name == "claude":
        if not os.getenv("ANTHROPIC_API_KEY"):
            raise RuntimeError("ANTHROPIC_API_KEY not set")
        return ClaudeProvider()
    raise ValueError(f"Unknown LLM provider: {name}")
