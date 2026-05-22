"""情境 → 對話 JSON。包含每句的單字 breakdown + 語法說明。"""
import json
import re
import sys
from pathlib import Path
import yaml

from providers.llm import get_provider

ROOT = Path(__file__).parent
OUT = ROOT / "dialogues.json"

SYSTEM = """你是日文語言學習對話設計師。產生最口語、自然、native speaker 真的會講的對話。
- 避免教科書腔
- 包含縮約、語助詞、自然停頓詞
- 每句要附上單字 breakdown（每個 token 包含表面形 / 讀音 / 詞性 / 中文意義）
- 每句要附上 grammar_note 解釋這句的關鍵句型或文化點
- 嚴格依照 JSON 格式輸出，不要加說明文字或 markdown fence"""

USER_TPL = """目標語言：日文（{native} 為母語學習者使用）
情境：{title}
背景：{context}
角色 A（you）：{you_role}
角色 B（other）：{other_role}

產生 {n} 句往返對話（A 跟 B 交替），輸出 JSON 陣列，每個元素：
{{
  "speaker": "you" | "other",
  "native": "{native}翻譯",
  "target": "日文句子",
  "breakdown": [
    {{"surface": "表面形", "reading": "假名讀音", "pos": "詞性", "meaning": "中文意義"}}
  ],
  "grammar_note": "1-2 句話解釋句型或文化點"
}}

只輸出 JSON 陣列，不要 markdown fence。"""


def extract_json(text: str) -> list[dict]:
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text, flags=re.MULTILINE)
    return json.loads(text)


def main() -> None:
    config = yaml.safe_load((ROOT / "scenarios.yaml").read_text())
    llm = get_provider("claude")

    result: list[dict] = []
    for scenario in config["scenarios"]:
        print(f"[generate] {scenario['id']} - {scenario['title']}", file=sys.stderr)
        prompt = USER_TPL.format(
            native=config["native_language"],
            title=scenario["title"],
            context=scenario["context"],
            you_role=scenario["roles"]["you"],
            other_role=scenario["roles"]["other"],
            n=config["sentences_per_scenario"],
        )
        raw = llm.complete(SYSTEM, prompt)
        try:
            lines = extract_json(raw)
        except json.JSONDecodeError as e:
            print(f"  [skip] JSON parse failed: {e}\n  raw: {raw[:200]}", file=sys.stderr)
            continue

        result.append({
            "id": scenario["id"],
            "title": scenario["title"],
            "context": scenario["context"],
            "lines": lines,
        })

    OUT.write_text(json.dumps(result, ensure_ascii=False, indent=2))
    total = sum(len(s["lines"]) for s in result)
    print(f"[done] {len(result)} scenarios, {total} lines → {OUT}", file=sys.stderr)


if __name__ == "__main__":
    main()
