"""dialogues.json -> MP3 + subtitle JSON.

Each scenario keeps a default target-language MP3 for compatibility and can also
produce practice variants for shadowing and recall.
"""
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
GAP_MS = 800
SHADOW_GAP_MS = 5000
PROVIDER_NAME = "edge"
VARIANT_MODES = ("target", "shadowing", "slow", "native_then_target", "target_then_native")


def speed_change(sound: AudioSegment, speed: float) -> AudioSegment:
    shifted = sound._spawn(sound.raw_data, overrides={"frame_rate": int(sound.frame_rate * speed)})
    return shifted.set_frame_rate(sound.frame_rate)


def concat(parts: list[AudioSegment]) -> AudioSegment:
    return sum(parts[1:], parts[0]) if parts else AudioSegment.silent(0)


def export_variant(
    scenario_id: str,
    mode: str,
    target_clips: list[AudioSegment],
    native_clips: list[AudioSegment],
    out_dir: Path,
) -> dict:
    silence = AudioSegment.silent(duration=GAP_MS)
    shadow_silence = AudioSegment.silent(duration=SHADOW_GAP_MS)
    parts: list[AudioSegment] = []

    if mode == "target":
        for clip in target_clips:
            parts.extend([clip, silence])
        filename = f"{scenario_id}.mp3"
        label = "Target only"
    elif mode == "shadowing":
        for clip in target_clips:
            parts.extend([clip, shadow_silence])
        filename = f"{scenario_id}.shadowing.mp3"
        label = "Shadowing long pause"
    elif mode == "slow":
        for clip in target_clips:
            parts.extend([speed_change(clip, 0.82), silence])
        filename = f"{scenario_id}.slow.mp3"
        label = "Slow target"
    elif mode == "native_then_target":
        for native, target in zip(native_clips, target_clips):
            parts.extend([native, AudioSegment.silent(duration=900), target, silence])
        filename = f"{scenario_id}.native-target.mp3"
        label = "Native then target"
    elif mode == "target_then_native":
        for target, native in zip(target_clips, native_clips):
            parts.extend([target, AudioSegment.silent(duration=900), native, silence])
        filename = f"{scenario_id}.target-native.mp3"
        label = "Target then native"
    else:
        raise ValueError(f"Unknown audio variant: {mode}")

    audio = concat(parts)
    out_path = out_dir / filename
    audio.export(out_path, format="mp3")
    return {
        "mode": mode,
        "label": label,
        "path": f"/audio/{filename}",
        "duration": len(audio) / 1000,
    }


async def main() -> None:
    config = yaml.safe_load((ROOT / "scenarios.yaml").read_text())
    lang_code = config["target_language_code"]
    native_lang_code = config.get("native_language_code", config.get("native_language", ""))
    tts = get_provider(PROVIDER_NAME)
    voices = tts.default_voices(lang_code)
    native_voice = tts.default_voices(native_lang_code).get("you") if native_lang_code else None

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
        target_clips: list[AudioSegment] = []
        native_clips: list[AudioSegment] = []
        cursor_ms = 0

        for idx, line in enumerate(lines, 1):
            voice = voices[line["speaker"]]
            clip_path = tmp_dir / f"{scenario_id}_{idx}.mp3"
            await tts.synthesize(line["target"], voice, clip_path)
            clip = AudioSegment.from_file(clip_path)
            target_clips.append(clip)
            if native_voice:
                native_clip_path = tmp_dir / f"{scenario_id}_{idx}_native.mp3"
                await tts.synthesize(line["native"], native_voice, native_clip_path)
                native_clips.append(AudioSegment.from_file(native_clip_path))
            start_ms = cursor_ms
            end_ms = cursor_ms + len(clip)
            subtitles.append({
                "order": idx,
                "speaker": line["speaker"],
                "native": line["native"],
                "target": line["target"],
                "line_id": line.get("line_id", f"{scenario_id}:{idx}"),
                "source_type": line.get("source_type", scenario.get("source_type", "generated_scenario")),
                "source_id": line.get("source_id", scenario.get("source_id", scenario_id)),
                "difficulty": line.get("difficulty", scenario.get("difficulty")),
                "review_state": line.get("review_state", "new"),
                "breakdown": line.get("breakdown", []),
                "grammar_note": line.get("grammar_note", ""),
                "start": start_ms / 1000,
                "end": end_ms / 1000,
            })
            segments.append(clip)
            segments.append(silence)
            cursor_ms = end_ms + GAP_MS

        combined = concat(segments)
        out_path = OUT_DIR / f"{scenario_id}.mp3"
        combined.export(out_path, format="mp3")
        variants = []
        for mode in VARIANT_MODES:
            if mode in {"native_then_target", "target_then_native"} and len(native_clips) != len(target_clips):
                continue
            variants.append(export_variant(scenario_id, mode, target_clips, native_clips, OUT_DIR))

        meta = {
            "id": scenario_id,
            "title": scenario["title"],
            "context": scenario.get("context", ""),
            "language_code": lang_code,
            "native_language_code": native_lang_code,
            "source_type": scenario.get("source_type", "generated_scenario"),
            "source_id": scenario.get("source_id", scenario_id),
            "difficulty": scenario.get("difficulty"),
            "duration": len(combined) / 1000,
            "variants": variants,
            "lines": subtitles,
        }
        (OUT_DIR / f"{scenario_id}.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2))
        index.append({
            "id": scenario_id,
            "title": meta["title"],
            "context": meta["context"],
            "duration": meta["duration"],
            "line_count": len(subtitles),
            "source_type": meta["source_type"],
            "source_id": meta["source_id"],
            "difficulty": meta["difficulty"],
            "variants": variants,
        })
        print(f"  → {out_path}", file=sys.stderr)

    (OUT_DIR / "index.json").write_text(json.dumps({"scenarios": index}, ensure_ascii=False, indent=2))

    for f in tmp_dir.iterdir():
        f.unlink()
    tmp_dir.rmdir()


if __name__ == "__main__":
    asyncio.run(main())
