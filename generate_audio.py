"""dialogues.json → MP3 + 字幕 JSON。每個情境一個 MP3，附帶時間戳與單字 breakdown。"""
import asyncio
import json
import sys
from pathlib import Path
import yaml
from pydub import AudioSegment

from providers.tts import get_provider

ROOT = Path(__file__).parent
DIALOGUES_PATH = ROOT / "dialogues.json"
OUT_DIR = ROOT / "audio"
GAP_MS = 2000
PROVIDER_NAME = "edge"


async def main() -> None:
    config = yaml.safe_load((ROOT / "scenarios.yaml").read_text())
    lang_code = config["target_language_code"]
    tts = get_provider(PROVIDER_NAME)
    voices = tts.default_voices(lang_code)

    OUT_DIR.mkdir(exist_ok=True)
    tmp_dir = OUT_DIR / ".tmp"
    tmp_dir.mkdir(exist_ok=True)

    dialogues = json.loads(DIALOGUES_PATH.read_text())
    index: list[dict] = []

    for scenario in dialogues:
        scenario_id = scenario["id"]
        lines = scenario["lines"]
        print(f"[audio] {scenario_id} ({len(lines)} lines)", file=sys.stderr)
        segments: list[AudioSegment] = []
        silence = AudioSegment.silent(duration=GAP_MS)
        subtitles: list[dict] = []
        cursor_ms = 0

        for idx, line in enumerate(lines, 1):
            voice = voices[line["speaker"]]
            clip_path = tmp_dir / f"{scenario_id}_{idx}.mp3"
            await tts.synthesize(line["target"], voice, clip_path)
            clip = AudioSegment.from_file(clip_path)
            start_ms = cursor_ms
            end_ms = cursor_ms + len(clip)
            subtitles.append({
                "order": idx,
                "speaker": line["speaker"],
                "native": line["native"],
                "target": line["target"],
                "breakdown": line.get("breakdown", []),
                "grammar_note": line.get("grammar_note", ""),
                "start": start_ms / 1000,
                "end": end_ms / 1000,
            })
            segments.append(clip)
            segments.append(silence)
            cursor_ms = end_ms + GAP_MS

        combined = sum(segments[1:], segments[0]) if segments else AudioSegment.silent(0)
        out_path = OUT_DIR / f"{scenario_id}.mp3"
        combined.export(out_path, format="mp3")

        meta = {
            "id": scenario_id,
            "title": scenario["title"],
            "context": scenario.get("context", ""),
            "language_code": lang_code,
            "duration": len(combined) / 1000,
            "lines": subtitles,
        }
        (OUT_DIR / f"{scenario_id}.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2))
        index.append({
            "id": scenario_id,
            "title": meta["title"],
            "context": meta["context"],
            "duration": meta["duration"],
            "line_count": len(subtitles),
        })
        print(f"  → {out_path}", file=sys.stderr)

    (OUT_DIR / "index.json").write_text(json.dumps({"scenarios": index}, ensure_ascii=False, indent=2))

    for f in tmp_dir.iterdir():
        f.unlink()
    tmp_dir.rmdir()


if __name__ == "__main__":
    asyncio.run(main())
