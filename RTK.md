# jp_podcast Project Guideline

## Purpose

This project is a personalized language-learning pipeline. It turns sentences the learner genuinely needs into "language islands", then produces podcast-style audio for repeated listening, prediction, shadowing, and active recall.

It is not a generic podcast generator, grammar course, flashcard app, or passive immersion player. The core goal is to help the learner repeatedly practice sentences they would actually say until those sentences become easy to generate.

## Core Method

The project follows these learning principles:

- Grammar should emerge from repeated meaningful use; it is not the starting point.
- The learner must actively generate sentences, not only recognize answers or choose from options.
- Passive immersion is not enough. Material should be comprehensible, personally relevant, and ideally previewed before listening.
- Daily focused study can stay around 30 minutes. Listening and shadowing should fit into dead time such as commuting, walking, chores, or getting ready.
- Discomfort during active recall is expected. When the learner cannot immediately produce the target sentence, that friction is where learning happens.

The default practice loop is:

1. Build language islands from a real source.
2. Generate natural, spoken, native-like target-language sentences.
3. Produce comfortable, repeatable TTS audio.
4. Listen until the next sentence becomes predictable.
5. Shadow the audio out loud.
6. Look at the native-language sentence and actively produce the target sentence.
7. Mark wrong or hesitant answers and review them more often.

## Two Primary Sources

The project should support two first-class source types. Both should eventually normalize into the same sentence-bank format.

### 1. Uploaded Audio Source

Use this when the learner records or uploads real-life speech, such as:

- Things they actually said during the day.
- Work updates, meeting openers, or self-introductions.
- Restaurant, doctor, travel, or shopping needs.
- Complaints, opinions, small talk, and recurring personal stories.

Expected pipeline:

1. Accept an uploaded audio file.
2. Transcribe it into the learner's native language.
3. Extract useful sentence candidates.
4. Rewrite messy spoken content into clear but natural native-language prompts.
5. Translate or localize them into natural target-language sentences.
6. Preserve personal tone and real usage context, avoiding textbook phrasing.
7. Generate audio, word breakdowns, and active-recall material from the sentence bank.

Important behavior:

- Preserve the learner's original intent, tone, and real-world use case.
- Prioritize sentences the learner is likely to say again.
- Remove filler only when it has no useful conversational value.
- Avoid over-polished textbook translations.

### 2. Generated Scenario Source

Use this when the learner wants to prepare for a situation, such as "ordering at a restaurant", "hotel check-in", "doctor visit", "work standup", or "asking for directions".

Expected pipeline:

1. Read scenario settings from `scenarios.yaml` or a future UI form.
2. Generate realistic dialogue for the situation.
3. Include both learner-side lines and counterpart lines.
4. Provide native-language meaning, target-language text, word breakdown, and grammar or culture notes for each sentence.
5. Produce audio suitable for listening, prediction, and shadowing.

Important behavior:

- Dialogue should sound like something native speakers would actually say, not like textbook examples.
- Prefer reusable sentence patterns that can be recombined in other situations.
- Keep each scenario short enough for repeated practice.
- Make the learner's own lines especially useful for active recall.

## Sentence Bank Requirements

Every generated sentence should include:

- `speaker`: who says the line, especially whether it is the learner's line.
- `native`: the learner's native-language meaning.
- `target`: the target-language sentence.
- `breakdown`: token-level word analysis, including reading, part of speech, and meaning when available.
- `grammar_note`: one or two sentences explaining the key pattern, nuance, or cultural point.

When possible, preserve source-tracking metadata:

- `source_type`: `uploaded_audio` or `generated_scenario`.
- `source_id`: audio id, file id, or scenario id.
- `scenario_title`: human-readable scenario name.
- `difficulty`: optional estimated difficulty.
- `review_state`: `new`, `correct`, `wrong`, `skipped`, or similar.

## Audio Requirements

Audio should be optimized for learning, not entertainment polish.

- Use a natural and comfortable target-language voice.
- Leave enough silence between sentences for prediction and shadowing.
- Keep voice settings consistent within the same scenario.
- Keep each scenario audio file short enough to replay many times.
- Future variants may include target-only, native-then-target, target-then-native, slow mode, and long-pause shadowing mode.

## Active Recall Requirements

The project should support an Excel-like wrong-answer workflow:

- Native-language sentence on the left.
- Target-language sentence hidden at first.
- The learner tries to say the target sentence out loud.
- Wrong, stuck, or hesitant answers can be marked for more frequent review.
- Learner-side sentences should be prioritized over counterpart-only lines.

This can be implemented as CSV, JSON, spreadsheet export, or a web UI. The format is secondary; the essential behavior is active generation plus wrong-answer review.

## Pre-Input Comprehension

Before listening to an audio track, the learner should be able to preview:

- Full transcript.
- Word breakdown.
- Grammar and culture notes.
- Difficult expressions and idioms.

The goal is for listening practice to verify the link between sound and meaning, rather than forcing the learner to blindly guess.

## Six-Week Learning Arc

Product and content design should respect this progression:

- Week 1: everything feels difficult; many wrong answers are normal.
- Week 2: 20-30 percent recall starts to appear.
- Week 3: some phrases begin to click and come out automatically.
- Week 4: the learner can sustain basic conversation with practiced patterns.
- Week 6: the learner can start recombining patterns and becomes genuinely conversational.

Do not design the first week to feel like failure. Wrong answers are data, not proof of inability.

## Engineering Principles

- Keep data structured. Prefer JSON, YAML, and CSV fields over parsing long prose.
- Prompts should explicitly ask for natural, spoken, native-like language.
- Scenario generation and uploaded-audio processing are two first-class input paths, but they should converge into the same sentence-bank format.
- Avoid hard-coded Japanese-only assumptions when target-language configuration can express the same idea.
- Generated artifacts should be reproducible where possible: the source config plus script should explain where an output came from.
- Do not commit API keys, overly large generated caches, or personal raw recordings unless that is explicitly intended.

## Current Project Shape

- `scenarios.yaml`: generated scenario source definitions.
- `generate_dialogues.py`: scenario-to-structured-dialogue JSON generation.
- `dialogues.json`: current generated sentence bank.
- `generate_audio.py`: sentence-bank-to-MP3 generation.
- `audio/`: generated audio and metadata.
- `web/`: learner-facing player and review UI.

Future uploaded-audio work should be implemented as a parallel ingestion path, then normalized into the same sentence-bank structure used by generated scenarios.
