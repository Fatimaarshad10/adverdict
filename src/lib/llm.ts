// Minimal OpenAI-compatible chat client.
// Works with Groq (free), OpenAI, or any compatible endpoint via env vars.

// OpenAI-compatible content: either a plain string, or an array of parts
// (text + image) for vision-capable models.
export type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string | ContentPart[];
}

// True when any user message carries an image part — picks the vision model.
function hasImage(messages: ChatMessage[]): boolean {
  return messages.some(
    (m) => Array.isArray(m.content) && m.content.some((p) => p.type === "image_url")
  );
}

export async function chat(
  messages: ChatMessage[],
  opts: { json?: boolean; temperature?: number } = {}
): Promise<string> {
  // Strip any trailing slash so we never produce a double slash before the path.
  const baseUrl = (process.env.LLM_BASE_URL || "https://api.groq.com/openai/v1").replace(/\/+$/, "");
  const apiKey = process.env.LLM_API_KEY;
  // Use a vision-capable model when an image is present. Never fall back to the
  // text model here — it rejects image content ("content must be a string").
  const model = hasImage(messages)
    ? process.env.LLM_VISION_MODEL || "meta-llama/llama-4-scout-17b-16e-instruct"
    : process.env.LLM_MODEL || "llama-3.3-70b-versatile";

  if (!apiKey) {
    throw new Error(
      "LLM_API_KEY is not set. Add it to .env.local, or set ADVERDICT_MODE=MOCK to run without an LLM."
    );
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: opts.temperature ?? 0.3,
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LLM request failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// Helper: ask the LLM for JSON and parse it defensively.
export async function chatJSON<T>(messages: ChatMessage[]): Promise<T> {
  const raw = await chat(messages, { json: true, temperature: 0.2 });
  return parseJsonLoose<T>(raw);
}

// Build a user message that optionally carries an image (data URL or https URL).
// When no image is given it returns a plain-text message so text-only models work.
export function userMessage(
  text: string,
  imageUrl?: string
): { role: "user"; content: string | ContentPart[] } {
  if (!imageUrl) return { role: "user", content: text };
  return {
    role: "user",
    content: [
      { type: "text", text },
      { type: "image_url", image_url: { url: imageUrl } },
    ],
  };
}

// LLMs sometimes wrap JSON in prose or code fences. Extract the JSON object.
export function parseJsonLoose<T>(raw: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]) as T;
    throw new Error(`Could not parse LLM JSON output: ${raw.slice(0, 200)}`);
  }
}
