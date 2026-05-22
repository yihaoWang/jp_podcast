"""CSV → MP3 + 字幕 JSON。每個情境一個 MP3，附帶帶時間戳的字幕。"""
import asyncio
import csv
import json
import sys
from collections import defaultdict
from pathlib import Path
import yaml
from pydub import AudioSegment

from providers.tts import get_provider

ROOT = Path(__file__).parent
CSV_PATH = ROOT / "dialogues.csv"
OUT_DIR = ROOT / "audio"
GAP_MS = 2000
PROVIDER_NAME = "edge"


async def synth_line(tts, text: str, voice: str, path: Path) -> None:
    await tts.synthesize(text, voice, path)


async def main() -> None:
    config = yaml.safe_load((ROOT / "scenarios.yaml").read_text())
    lang_code = config["target_language_code"]
    tts = get_provider(PROVIDER_NAME)
    voices = tts.default_voices(lang_code)

    OUT_DIR.mkdir(exist_ok=True)
    tmp_dir = OUT_DIR / ".tmp"
    tmp_dir.mkdir(exist_ok=True)

    grouped: dict[str, list[dict]] = defaultdict(list)
    with CSV_PATH.open(encoding="utf-8") as f:
        for row in csv.DictReader(f):
            grouped[row["scenario_id"]].append(row)

    index: list[dict] = []

    for scenario_id, lines in grouped.items():
        print(f"[audio] {scenario_id} ({len(lines)} lines)", file=sys.stderr)
        segments: list[AudioSegment] = []
        silence = AudioSegment.silent(duration=GAP_MS)
        subtitles: list[dict] = []
        cursor_ms = 0

        for line in lines:
            voice = voices[line["speaker"]]
            clip_path = tmp_dir / f"{scenario_id}_{line['order']}.mp3"
            await synth_line(tts, line["target"], voice, clip_path)
            clip = AudioSegment.from_file(clip_path)
            start_ms = cursor_ms
            end_ms = cursor_ms + len(clip)
            subtitles.append({
                "order": int(line["order"]),
                "speaker": line["speaker"],
                "native": line["native"],
                "target": line["target"],
                "start": start_ms / 1000,
                "end": end_ms / 1000,
            })
            segments.append(clip)
            segments.append(silence)
            cursor_ms = end_ms + GAP_MS

        combined = sum(segments[1:], segments[0]) if segments else AudioSegment.silent(0)
        out_path = OUT_DIR / f"{scenario_id}.mp3"
        combined.export(out_path, format="mp3")

        scenario_meta = next((s for s in config["scenarios"] if s["id"] == scenario_id), None)
        meta = {
            "id": scenario_id,
            "title": lines[0]["scenario_title"],
            "context": scenario_meta["context"] if scenario_meta else "",
            "language_code": lang_code,
            "duration": len(combined) / 1000,
            "lines": subtitles,
        }
        (OUT_DIR / f"{scenario_id}.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2))
        index.append({"id": scenario_id, "title": meta["title"], "context": meta["context"], "duration": meta["duration"], "line_count": len(subtitles)})
        print(f"  → {out_path}", file=sys.stderr)

    (OUT_DIR / "index.json").write_text(json.dumps({"scenarios": index}, ensure_ascii=False, indent=2))

    for f in tmp_dir.iterdir():
        f.unlink()
    tmp_dir.rmdir()


if __name__ == "__main__":
    asyncio.run(main())
