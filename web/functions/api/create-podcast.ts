interface Env {
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  ANTHROPIC_MODEL?: string;
}

interface PagesFunctionContext {
  request: Request;
  env: Env;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
    },
  });

const extractJson = (text: string) => {
  const cleaned = text.trim().replace(/^```(?:json)?\s*|\s*```$/gm, "");
  return JSON.parse(cleaned);
};

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48) || `upload_${Date.now()}`;

export const onRequestOptions = () => new Response(null, { headers: corsHeaders });

export const onRequestPost = async ({ request, env }: PagesFunctionContext) => {
  if (!env.OPENAI_API_KEY || !env.ANTHROPIC_API_KEY) {
    return json({
      error: "Missing OPENAI_API_KEY or ANTHROPIC_API_KEY in the deployment environment.",
    }, 500);
  }

  const form = await request.formData();
  const audio = form.get("audio");
  const nativeLanguage = String(form.get("native_language") || "繁體中文");
  const targetLanguage = String(form.get("target_language") || "japanese");

  if (!(audio instanceof File)) {
    return json({ error: "Missing audio file." }, 400);
  }

  const transcriptForm = new FormData();
  transcriptForm.append("file", audio, audio.name || "upload_audio");
  transcriptForm.append("model", "whisper-1");

  const transcriptResp = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: transcriptForm,
  });

  if (!transcriptResp.ok) {
    return json({
      error: "Audio transcription failed.",
      detail: await transcriptResp.text(),
    }, 502);
  }

  const transcript = (await transcriptResp.json() as { text?: string }).text ?? "";
  const system = `You convert uploaded learner audio into a personal language-learning podcast script.
Target language: ${targetLanguage}
Learner native language: ${nativeLanguage}

Return strict JSON only. No markdown.
Create natural spoken target-language lines, word breakdowns, and grammar notes.
Preserve the learner's intent and real-life use case. Avoid textbook phrasing.`;

  const user = `Transcript:
${transcript}

Create a JSON object:
{
  "title": "short title in ${nativeLanguage}",
  "context": "one sentence context in ${nativeLanguage}",
  "lines": [
    {
      "speaker": "you",
      "native": "cleaned ${nativeLanguage} sentence",
      "target": "natural ${targetLanguage} sentence",
      "breakdown": [
        {"surface": "surface form", "reading": "reading", "pos": "part of speech", "meaning": "${nativeLanguage} meaning"}
      ],
      "grammar_note": "1-2 sentence explanation in ${nativeLanguage}"
    }
  ]
}

Limit to 12-20 useful learner-side lines.`;

  const anthropicResp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
      max_tokens: 4096,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });

  if (!anthropicResp.ok) {
    return json({
      error: "LLM sentence generation failed.",
      detail: await anthropicResp.text(),
    }, 502);
  }

  const anthropicBody = await anthropicResp.json() as { content?: Array<{ text?: string }> };
  const generated = extractJson(anthropicBody.content?.[0]?.text ?? "{}");
  const id = `upload_${slugify(generated.title || audio.name || "audio")}`;

  const lines = (generated.lines ?? []).map((line: Record<string, unknown>, index: number) => ({
    ...line,
    order: index + 1,
    speaker: "you",
    start: 0,
    end: 0,
    line_id: `${id}:${index + 1}`,
    source_type: "uploaded_audio",
    source_id: id,
    review_state: "new",
  }));

  return json({
    id,
    title: generated.title || audio.name || "Uploaded audio",
    context: generated.context || transcript.slice(0, 120),
    transcript,
    language_code: targetLanguage,
    native_language_code: nativeLanguage,
    source_type: "uploaded_audio",
    source_id: id,
    duration: 0,
    variants: [],
    lines,
  });
};
