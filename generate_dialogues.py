"""情境 → 對話 CSV。讀 scenarios.yaml，呼叫 LLM 產出每個情境的雙人對話。"""
import csv
import json
import re
import sys
from pathlib import Path
import yaml

from providers.llm import get_provider

ROOT = Path(__file__).parent
OUT = ROOT / "dialogues.csv"

SYSTEM = """你是語言學習對話設計師。產生最口語、自然、native speaker 真的會講的對話。
- 避免教科書腔
- 包含縮約、語助詞、自然停頓詞
- 嚴格依照使用者指定的 JSON 格式輸出，不要加任何說明文字"""

USER_TPL = """目標語言：{lang}（{native} 為母語學習者使用）
情境：{title}
背景：{context}
角色 A（you）：{you_role}
角色 B（other）：{other_role}

請產生 {n} 句往返對話（A 跟 B 交替），輸出 JSON 陣列，每個元素：
{{"speaker": "you" | "other", "native": "{native}翻譯", "target": "目標語句子"}}

只輸出 JSON，不要 markdown code fence。"""


def extract_json(text: str) -> list[dict]:
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text, flags=re.MULTILINE)
    return json.loads(text)


def main() -> None:
    config = yaml.safe_load((ROOT / "scenarios.yaml").read_text())
    llm = get_provider("claude")

    rows: list[dict] = []
    for scenario in config["scenarios"]:
        print(f"[generate] {scenario['id']} - {scenario['title']}", file=sys.stderr)
        prompt = USER_TPL.format(
            lang=config["target_language"],
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

        for idx, line in enumerate(lines, 1):
            rows.append({
                "scenario_id": scenario["id"],
                "scenario_title": scenario["title"],
                "order": idx,
                "speaker": line["speaker"],
                "native": line["native"],
                "target": line["target"],
            })

    with OUT.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["scenario_id", "scenario_title", "order", "speaker", "native", "target"])
        writer.writeheader()
        writer.writerows(rows)

    print(f"[done] {len(rows)} lines → {OUT}", file=sys.stderr)


if __name__ == "__main__":
    main()
