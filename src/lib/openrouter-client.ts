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
  primaryModel?: string;
  fallbackModel?: string;
  useFallbackOnParseError?: boolean;
  enableWebSearch?: boolean;
}

const OPENROUTER_URL =
  process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";

/**
 * Extract JSON from LLM response that might be wrapped in markdown code blocks
 */
function extractJSON(content: string): string {
  // Try to extract from markdown code blocks
  const jsonBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonBlockMatch) {
    return jsonBlockMatch[1].trim();
  }
  
  // Try to find JSON object or array
  const jsonMatch = content.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) {
    return jsonMatch[1].trim();
  }
  
  return content.trim();
}

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
      "X-Title": "InvestBoard Dashboard",
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
 * Uses :online suffix for web search enabled models.
 *
 * - Primary model: gpt-5-nano:online (web search enabled)
 * - Fallback model: gpt-5-mini:online
 */
export async function callOpenRouterJSON<T = any>({
  systemPrompt,
  userPrompt,
  temperature = 0,
  maxTokens = 2000,
  primaryModel,
  fallbackModel,
  useFallbackOnParseError = true,
  enableWebSearch = true,
}: LLMCallOptions): Promise<LLMJsonResponse<T>> {
  // Get base model names from env or defaults
  const baseNano = primaryModel ?? process.env.OPENROUTER_MODEL_NANO ?? "openai/gpt-5-nano";
  const baseMini = fallbackModel ?? process.env.OPENROUTER_MODEL_MINI ?? "openai/gpt-5-mini";
  
  // Add :online suffix for web search if enabled and not already present
  const nanoModel = enableWebSearch && !baseNano.includes(":online") 
    ? `${baseNano}:online` 
    : baseNano;
  const miniModel = enableWebSearch && !baseMini.includes(":online") 
    ? `${baseMini}:online` 
    : baseMini;

  // 1) Try primary model first
  try {
    const { content, json } = await callOpenRouterRaw({
      systemPrompt,
      userPrompt,
      temperature,
      maxTokens,
      model: nanoModel,
    });

    try {
      const jsonStr = extractJSON(content);
      const parsed = JSON.parse(jsonStr);
      return { ok: true, data: parsed as T, raw: json, modelUsed: nanoModel };
    } catch (parseErr: any) {
      console.error(`JSON parse error from ${nanoModel}:`, parseErr.message, content.substring(0, 200));
      if (!useFallbackOnParseError) {
        return {
          ok: false,
          error: `Primary JSON parse error: ${parseErr.message}`,
          raw: { content },
          modelUsed: nanoModel,
        };
      }
      // Fall through to fallback model
    }
  } catch (err: any) {
    console.error(`Primary model error (${nanoModel}):`, err.message);
    if (!useFallbackOnParseError) {
      return {
        ok: false,
        error: `Primary call error: ${err.message}`,
        modelUsed: nanoModel,
      };
    }
  }

  // 2) Fallback model
  try {
    const { content, json } = await callOpenRouterRaw({
      systemPrompt,
      userPrompt,
      temperature,
      maxTokens,
      model: miniModel,
    });

    const jsonStr = extractJSON(content);
    const parsed = JSON.parse(jsonStr);
    return { ok: true, data: parsed as T, raw: json, modelUsed: miniModel };
  } catch (err: any) {
    console.error(`Fallback model error (${miniModel}):`, err.message);
    return { ok: false, error: `Fallback error: ${err.message}`, modelUsed: miniModel };
  }
}
