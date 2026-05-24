from abc import ABC, abstractmethod
from pathlib import Path
import asyncio
import edge_tts


class TTSProvider(ABC):
    @abstractmethod
    async def synthesize(self, text: str, voice: str, output_path: Path) -> None: ...

    @abstractmethod
    def default_voices(self, language_code: str) -> dict[str, str]:
        """Return {"you": voice_id, "other": voice_id} for the target language."""


class EdgeTTSProvider(TTSProvider):
    VOICE_MAP = {
        "ja": {"you": "ja-JP-NanamiNeural", "other": "ja-JP-KeitaNeural"},
        "en": {"you": "en-US-AvaNeural", "other": "en-US-AndrewNeural"},
        "es": {"you": "es-ES-ElviraNeural", "other": "es-ES-AlvaroNeural"},
        "zh-TW": {"you": "zh-TW-HsiaoChenNeural", "other": "zh-TW-YunJheNeural"},
    }

    async def synthesize(self, text: str, voice: str, output_path: Path) -> None:
        communicator = edge_tts.Communicate(text, voice)
        await communicator.save(str(output_path))

    def default_voices(self, language_code: str) -> dict[str, str]:
        if language_code not in self.VOICE_MAP:
            raise ValueError(f"No default voices for language: {language_code}")
        return self.VOICE_MAP[language_code]


def get_provider(name: str = "edge") -> TTSProvider:
    if name == "edge":
        return EdgeTTSProvider()
    raise ValueError(f"Unknown TTS provider: {name}. Add a new class in providers/tts.py")
