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
}

const OPENROUTER_URL =
  process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";

// Default timeout for LLM calls (25 seconds)
const LLM_TIMEOUT_MS = 25000;

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
  // Add timeout using AbortController
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);

  try {
    console.log(`Calling OpenRouter with model: ${model}`);
    
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
        // Enable web search for models that support it
        ...(model.includes("sonar") ? {} : {
          plugins: [{ id: "web", max_results: 10 }]
        }),
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`OpenRouter HTTP ${res.status}: ${res.statusText} ${text}`);
    }

    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content ?? "";
    console.log(`OpenRouter response received, content length: ${content.length}`);
    return { content, json };
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error(`Request timed out after ${LLM_TIMEOUT_MS}ms`);
    }
    throw err;
  }
}

/**
 * Main helper for all LLM calls that must return strict JSON.
 * 
 * Uses Perplexity Sonar as primary model (has built-in web search).
 * Falls back to GPT-5-mini if needed.
 */
export async function callOpenRouterJSON<T = any>({
  systemPrompt,
  userPrompt,
  temperature = 0,
  maxTokens = 1500,
  primaryModel,
  fallbackModel,
  useFallbackOnParseError = true,
}: LLMCallOptions): Promise<LLMJsonResponse<T>> {
  // Perplexity Sonar has built-in web search - best for real-time financial data
  const sonarModel = primaryModel ?? process.env.OPENROUTER_MODEL_PRIMARY ?? "perplexity/sonar";
  const backupModel = fallbackModel ?? process.env.OPENROUTER_MODEL_FALLBACK ?? "openai/gpt-5-mini";

  // 1) Try Perplexity Sonar first (has web search built-in)
  try {
    const { content, json } = await callOpenRouterRaw({
      systemPrompt,
      userPrompt,
      temperature,
      maxTokens,
      model: sonarModel,
    });

    try {
      const jsonStr = extractJSON(content);
      const parsed = JSON.parse(jsonStr);
      return { ok: true, data: parsed as T, raw: json, modelUsed: sonarModel };
    } catch (parseErr: any) {
      console.error(`JSON parse error from ${sonarModel}:`, parseErr.message, content.substring(0, 200));
      if (!useFallbackOnParseError) {
        return {
          ok: false,
          error: `Primary JSON parse error: ${parseErr.message}`,
          raw: { content },
          modelUsed: sonarModel,
        };
      }
      // Fall through to backup model
    }
  } catch (err: any) {
    console.error(`Primary model error (${sonarModel}):`, err.message);
    if (!useFallbackOnParseError) {
      return {
        ok: false,
        error: `Primary call error: ${err.message}`,
        modelUsed: sonarModel,
      };
    }
  }

  // 2) Fallback to GPT-5-mini
  try {
    console.log(`Falling back to ${backupModel}`);
    const { content, json } = await callOpenRouterRaw({
      systemPrompt,
      userPrompt,
      temperature,
      maxTokens,
      model: backupModel,
    });

    const jsonStr = extractJSON(content);
    const parsed = JSON.parse(jsonStr);
    return { ok: true, data: parsed as T, raw: json, modelUsed: backupModel };
  } catch (err: any) {
    console.error(`Fallback model error (${backupModel}):`, err.message);
    return { ok: false, error: `Fallback error: ${err.message}`, modelUsed: backupModel };
  }
}
