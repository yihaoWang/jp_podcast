# jp_podcast

語言學習 pipeline：情境 → AI 對話 → TTS Podcast。

## 安裝

```bash
pip install -r requirements.txt
brew install ffmpeg  # pydub 合併 MP3 需要
export ANTHROPIC_API_KEY=sk-...
```

## 使用

```bash
# 1. 編輯 scenarios.yaml，加入你想練的情境
# 2. 用 LLM 產生對話 CSV
python generate_dialogues.py

# 3. 用 TTS 合成 MP3（預設 Edge TTS，免費）
python generate_audio.py
```

輸出：
- `dialogues.csv` — 完整句庫（中文 / 目標語 / 角色）
- `audio/<scenario_id>.mp3` — 每個情境一個 Podcast，句間 2 秒空白

## 換 TTS Provider

`providers/tts.py` 新增 class 實作 `TTSProvider`，在 `get_provider()` 註冊。
然後改 `generate_audio.py` 的 `PROVIDER_NAME`。

候選：OpenAI TTS HD、ElevenLabs、Azure Neural TTS。
