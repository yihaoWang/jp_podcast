"""Create a sentence-bank scenario from learner-provided real-life speech.

This is the uploaded-audio ingestion path. Today it accepts a transcript file and
optionally records the original audio path as metadata. A future transcription
provider can populate the transcript before this script runs.
"""
import argparse
import json
import re
import sys
from pathlib import Path

import yaml

from providers.llm import get_provider

ROOT = Path(__file__).parent
OUT = ROOT / "dialogues.json"

SYSTEM_TPL = """You convert learner-provided real-life speech into a language-learning sentence island.
Target language: {target_language}
Learner native language: {native_language}

Rules:
- Preserve the learner's intent, tone, and real use case.
- Prefer sentences the learner is likely to say again.
- Clean up messy spoken language only enough to make each sentence useful.
- Translate or localize into natural, spoken, native-like {target_language}.
- Avoid textbook phrasing.
- Each line must include word breakdown with surface / reading / pos / meaning in {native_language}.
- Each line must include grammar_note in {native_language}.
- Output strict JSON only. Do not include markdown fences."""

USER_TPL = """Title: {title}
Context: {context}
Learner transcript:
{transcript}

Create up to {limit} useful learner-side lines. Output a JSON array. Each element:
{{
  "speaker": "you",
  "native": "cleaned {native_language} sentence",
  "target": "natural {target_language} sentence",
  "breakdown": [
    {{"surface": "surface form", "reading": "reading or pronunciation", "pos": "part of speech", "meaning": "{native_language} meaning"}}
  ],
  "grammar_note": "1-2 sentence explanation in {native_language}"
}}"""


def extract_json(text: str) -> list[dict]:
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text, flags=re.MULTILINE)
    return json.loads(text)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Ingest transcript/audio into dialogues.json")
    parser.add_argument("--transcript", required=True, help="Path to a native-language transcript text file")
    parser.add_argument("--audio", help="Optional original audio path to record as metadata")
    parser.add_argument("--id", required=True, help="Scenario id to create or replace")
    parser.add_argument("--title", required=True, help="Human-readable title")
    parser.add_argument("--context", required=True, help="Real-world context")
    parser.add_argument("--limit", type=int, default=20, help="Maximum useful learner-side lines")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    config = yaml.safe_load((ROOT / "scenarios.yaml").read_text())
    transcript = Path(args.transcript).read_text()
    llm = get_provider("claude")
    target_language = config["target_language"]
    native_language = config["native_language"]
    system = SYSTEM_TPL.format(target_language=target_language, native_language=native_language)
    prompt = USER_TPL.format(
        title=args.title,
        context=args.context,
        transcript=transcript,
        limit=args.limit,
        target_language=target_language,
        native_language=native_language,
    )
    raw = llm.complete(system, prompt)
    lines = extract_json(raw)
    for idx, line in enumerate(lines, 1):
        line["speaker"] = "you"
        line.setdefault("review_state", "new")
        line.setdefault("source_type", "uploaded_audio")
        line.setdefault("source_id", args.id)
        line.setdefault("line_id", f"{args.id}:{idx}")

    scenario = {
        "id": args.id,
        "title": args.title,
        "context": args.context,
        "source_type": "uploaded_audio",
        "source_id": args.id,
        "source_audio": args.audio,
        "difficulty": None,
        "lines": lines,
    }

    existing = json.loads(OUT.read_text()) if OUT.exists() else []
    existing = [item for item in existing if item["id"] != args.id]
    existing.append(scenario)
    OUT.write_text(json.dumps(existing, ensure_ascii=False, indent=2) + "\n")
    print(f"[done] wrote uploaded-audio scenario {args.id} with {len(lines)} lines", file=sys.stderr)


if __name__ == "__main__":
    main()
