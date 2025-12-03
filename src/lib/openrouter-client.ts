export interface LLMJsonResponse<T> {
  ok: boolean;
  data?: T;
  raw?: any;
  error?: string;
  modelUsed?: string;
}

interface LLMCallOptions {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  primaryModel?: string; // default: nano
  fallbackModel?: string; // default: mini
  useFallbackOnParseError?: boolean; // default true
}

const OPENROUTER_URL =
  process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";

async function callOpenRouterRaw({
  systemPrompt,
  userPrompt,
  temperature,
  maxTokens,
  model,
}: {
  systemPrompt: string;
  userPrompt: string;
  temperature: number;
  maxTokens: number;
  model: string;
}) {
  const res = await fetch(`${OPENROUTER_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "HTTP-Referer":
        process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      "X-Title": "Invest Dashboard",
    },
    body: JSON.stringify({
      model,
      temperature,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`OpenRouter HTTP ${res.status}: ${res.statusText} ${text}`);
  }

  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content ?? "";
  return { content, json };
}

/**
 * Main helper for all LLM calls that must return strict JSON.
 *
 * - Primary model: gpt-5-nano
 * - Fallback model: gpt-5-mini (only if parse fails and useFallbackOnParseError=true)
 */
export async function callOpenRouterJSON<T = any>({
  systemPrompt,
  userPrompt,
  temperature = 0,
  maxTokens = 1800,
  primaryModel,
  fallbackModel,
  useFallbackOnParseError = true,
}: LLMCallOptions): Promise<LLMJsonResponse<T>> {
  const nanoModel =
    primaryModel ??
    process.env.OPENROUTER_MODEL_NANO ??
    "openai/gpt-5-nano";
  const miniModel =
    fallbackModel ??
    process.env.OPENROUTER_MODEL_MINI ??
    "openai/gpt-5-mini";

  // 1) Try nano first
  try {
    const { content, json } = await callOpenRouterRaw({
      systemPrompt,
      userPrompt,
      temperature,
      maxTokens,
      model: nanoModel,
    });

    try {
      const parsed = JSON.parse(content);
      return { ok: true, data: parsed as T, raw: json, modelUsed: nanoModel };
    } catch (parseErr: any) {
      if (!useFallbackOnParseError) {
        return {
          ok: false,
          error: `Nano JSON parse error: ${parseErr.message}`,
          raw: { content },
          modelUsed: nanoModel,
        };
      }
      // else: fall through to mini
    }
  } catch (err: any) {
    // network/HTTP error; we can decide to fallback or not
    if (!useFallbackOnParseError) {
      return {
        ok: false,
        error: `Nano call error: ${err.message}`,
        modelUsed: nanoModel,
      };
    }
  }

  // 2) Fallback: mini
  try {
    const { content, json } = await callOpenRouterRaw({
      systemPrompt,
      userPrompt,
      temperature,
      maxTokens,
      model: miniModel,
    });

    const parsed = JSON.parse(content);
    return { ok: true, data: parsed as T, raw: json, modelUsed: miniModel };
  } catch (err: any) {
    return { ok: false, error: `Mini fallback error: ${err.message}` };
  }
}

