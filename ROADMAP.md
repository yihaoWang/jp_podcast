# jp_podcast Roadmap

This roadmap tracks the gap between the current implementation and the project guideline in `RTK.md`.

## Priority 0: Useful Scenario Podcasts

Goal: expand the generated-scenario source with immediately useful everyday and travel situations.

Todo:

- Add high-value scenarios to `scenarios.yaml`.
- Generate updated `dialogues.json`.
- Generate MP3 and metadata files under `audio/`.
- Keep each scenario compact enough for repeated listening and shadowing.
- Prioritize learner-side lines that are useful for active recall.

Candidate scenario categories:

- Restaurants, cafes, izakaya, and food restrictions.
- Convenience stores and payment.
- Train stations, route confusion, and missed trains.
- Hotel check-in and basic requests.
- Pharmacies and symptoms.
- Phone reservations.
- Workplace standups and status updates.
- Small talk, apologies, and asking for help.

## Priority 1: Unified Sentence-Bank Schema

Goal: make generated scenarios and future uploaded-audio sources converge into one durable data format.

Todo:

- Add `source_type` with values such as `generated_scenario` and `uploaded_audio`.
- Add `source_id` to preserve where each line came from.
- Add optional `difficulty`.
- Add `review_state` for `new`, `correct`, `wrong`, and `skipped`.
- Update TypeScript types to match the richer schema.
- Preserve backward compatibility for existing generated audio metadata.

## Priority 2: Active Recall and Wrong-Answer Review

Goal: turn the player into a real recall tool, not only a transcript player.

Todo:

- Add a recall mode that shows native text first and hides the target sentence.
- Add reveal, correct, wrong, and skip controls.
- Persist review state locally at first.
- Prioritize wrong and hesitant learner-side lines.
- Add a filtered review queue for `you` lines.
- Consider CSV or spreadsheet export for external review.

## Priority 3: Uploaded Audio Source

Goal: support the methodology's personal language-island workflow.

Todo:

- Add an upload or import path for learner audio.
- Transcribe uploaded audio into the learner's native language.
- Extract useful sentence candidates.
- Rewrite messy speech into clear but natural native-language prompts.
- Translate or localize into natural target-language sentences.
- Normalize the result into the shared sentence-bank schema.
- Generate audio and review material from the normalized sentence bank.

## Priority 4: Audio Practice Variants

Goal: produce audio versions optimized for different practice modes.

Todo:

- Target-only version.
- Native-then-target version.
- Target-then-native version.
- Slow version.
- Long-pause shadowing version.
- Configurable gap duration per practice mode.

## Priority 5: Internationalization

Goal: make the product easier to use beyond the current Traditional Chinese to Japanese setup.

Todo:

- Remove hard-coded Japanese assumptions from generation prompts.
- Use `target_language`, `target_language_code`, and `native_language` consistently.
- Internationalize frontend UI labels.
- Keep generated learner-facing content in the configured native language.
- Expand default TTS voice mappings for more target languages.
