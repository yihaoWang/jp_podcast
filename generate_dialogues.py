"""Scenario config -> dialogue JSON with word breakdown and grammar notes."""
import json
import re
import sys
from pathlib import Path
import yaml

from providers.llm import get_provider

ROOT = Path(__file__).parent
OUT = ROOT / "dialogues.json"

SYSTEM_TPL = """You are a language-learning dialogue designer.
Generate the most natural, spoken {target_language} that native speakers would actually use.
- Avoid textbook phrasing.
- Include contractions, particles, discourse markers, and natural spoken rhythm when appropriate.
- Each line must include a word breakdown. Each token should include surface / reading / part of speech / meaning in {native_language}.
- Each line must include grammar_note explaining the key pattern, nuance, or culture point in {native_language}.
- Output strict JSON only. Do not include explanation text or markdown fences."""

USER_TPL = """Target language: {target_language}
Learner native language: {native_language}
Scenario: {title}
Context: {context}
Role A (you): {you_role}
Role B (other): {other_role}

Generate {n} alternating dialogue lines between A and B. Output a JSON array. Each element:
{{
  "speaker": "you" | "other",
  "native": "{native_language} meaning",
  "target": "{target_language} sentence",
  "breakdown": [
    {{"surface": "surface form", "reading": "reading or pronunciation", "pos": "part of speech", "meaning": "{native_language} meaning"}}
  ],
  "grammar_note": "1-2 sentence explanation in {native_language}"
}}

Output only the JSON array. Do not use markdown fences."""


def extract_json(text: str) -> list[dict]:
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text, flags=re.MULTILINE)
    return json.loads(text)


def main() -> None:
    config = yaml.safe_load((ROOT / "scenarios.yaml").read_text())
    llm = get_provider("claude")
    target_language = config["target_language"]
    native_language = config["native_language"]
    system = SYSTEM_TPL.format(target_language=target_language, native_language=native_language)

    result: list[dict] = []
    for scenario in config["scenarios"]:
        print(f"[generate] {scenario['id']} - {scenario['title']}", file=sys.stderr)
        prompt = USER_TPL.format(
            native_language=native_language,
            target_language=target_language,
            title=scenario["title"],
            context=scenario["context"],
            you_role=scenario["roles"]["you"],
            other_role=scenario["roles"]["other"],
            n=config["sentences_per_scenario"],
        )
        raw = llm.complete(system, prompt)
        try:
            lines = extract_json(raw)
        except json.JSONDecodeError as e:
            print(f"  [skip] JSON parse failed: {e}\n  raw: {raw[:200]}", file=sys.stderr)
            continue
        for idx, line in enumerate(lines, 1):
            line.setdefault("review_state", "new")
            line.setdefault("source_type", "generated_scenario")
            line.setdefault("source_id", scenario["id"])
            line.setdefault("line_id", f"{scenario['id']}:{idx}")

        result.append({
            "id": scenario["id"],
            "title": scenario["title"],
            "context": scenario["context"],
            "source_type": "generated_scenario",
            "source_id": scenario["id"],
            "difficulty": scenario.get("difficulty"),
            "lines": lines,
        })

    OUT.write_text(json.dumps(result, ensure_ascii=False, indent=2))
    total = sum(len(s["lines"]) for s in result)
    print(f"[done] {len(result)} scenarios, {total} lines → {OUT}", file=sys.stderr)


if __name__ == "__main__":
    main()
