# jp_podcast

A language-learning pipeline: real speech / scenarios -> AI language islands -> TTS podcast -> listening, prediction, shadowing, and active recall.

This project follows the guideline in [RTK.md](/Users/yihao.wang/project/jp_podcast/RTK.md). It is not a generic podcast generator. Its purpose is to turn sentences the learner genuinely needs into repeatable listening and recall material.

See [ROADMAP.md](/Users/yihao.wang/project/jp_podcast/ROADMAP.md) for implementation priorities.

## Two Source Types

1. Uploaded audio: record real things you say in daily life or at work, then transcribe and convert them into natural target-language sentence islands.
2. Generated scenarios: define restaurant, work meeting, doctor visit, directions, or other situations in `scenarios.yaml`, then generate natural native-speaker dialogue.

Both sources should converge into the same sentence-bank format so they can share audio generation, word breakdowns, wrong-answer review, and the web player.

## Installation

```bash
pip install -r requirements.txt
brew install ffmpeg  # required by pydub when combining MP3 files
cp .env.example .env
# Then edit .env and set ANTHROPIC_API_KEY.
```

## Usage

```bash
# 1. Edit scenarios.yaml and add situations you want to practice.
# 2. Generate dialogue JSON with the LLM.
python generate_dialogues.py

# 3. Generate MP3 audio with TTS. Edge TTS is the default free provider.
python generate_audio.py
```

Outputs:

- `dialogues.json`: full sentence bank with native text, target text, speaker, word breakdown, and grammar notes.
- `audio/<scenario_id>.mp3`: one podcast-style audio file per scenario, with 2 seconds of silence between sentences.

## Uploaded Speech Ingestion

In the web app, use **Upload audio** and provide only the recording. The deployed API transcribes the audio and asks the LLM to create the title, context, target-language sentences, word breakdowns, and grammar notes.

Required deployment environment variables:

- `OPENAI_API_KEY`: audio transcription
- `ANTHROPIC_API_KEY`: sentence-island generation
- `ANTHROPIC_MODEL`: optional, defaults to `claude-sonnet-4-6`

For local CLI ingestion with an existing transcript:

```bash
python ingest_uploaded_source.py \
  --transcript path/to/transcript.txt \
  --audio path/to/original.m4a \
  --id my_daily_phrases \
  --title "My daily phrases" \
  --context "Things I actually said at work today"
python generate_audio.py
```

The CLI path is for batch/local workflows where a transcript already exists. The web app should remain audio-only.

## Switching TTS Providers

Add a class implementing `TTSProvider` in `providers/tts.py`, then register it in `get_provider()`.

Update `PROVIDER_NAME` in `generate_audio.py`.

Provider candidates: OpenAI TTS HD, ElevenLabs, Azure Neural TTS.
