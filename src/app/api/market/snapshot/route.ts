import { NextRequest, NextResponse } from "next/server";
import { callOpenRouterJSON } from "@/lib/openrouter-client";
import { FINANCE_DATA_SYSTEM_PROMPT } from "@/lib/prompts";
import {
  getSnapshotCache,
  upsertSnapshotCache,
} from "@/lib/db/repositories/snapshotRepo";
import { getFromMemoryCache, setInMemoryCache, cacheKeys } from "@/lib/cache";

// Increase function timeout for LLM calls with web search
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl;
    const refresh = url.searchParams.get("refresh") === "true";
    const cacheKey = cacheKeys.marketSnapshot();

    // Check cache first (DB then memory)
    if (!refresh) {
      // Try database cache
      try {
        const cached = await getSnapshotCache();
        if (cached) {
          return NextResponse.json(cached);
        }
      } catch (dbErr) {
        console.error("DB cache read failed, trying memory cache:", dbErr);
      }
      
      // Try memory cache
      const memoryCached = getFromMemoryCache(cacheKey);
      if (memoryCached) {
        return NextResponse.json(memoryCached);
      }
    }

    // Fetch new data via LLM with web search
    const userPrompt = `
Search the web for CURRENT Indian stock market data as of today.

Fetch:
- Nifty 50 index (current value, change, change %)
- Sensex index (current value, change, change %)
- Nifty Bank index (current value, change, change %)
- Market breadth: advances, declines, unchanged counts

Use real-time sources like NSE India, BSE India, Moneycontrol, Economic Times for current market data.

Return ONLY a JSON object with this structure:
{
  "nifty50": { "value": number, "change": number, "changePercent": number },
  "sensex": { "value": number, "change": number, "changePercent": number },
  "niftyBank": { "value": number, "change": number, "changePercent": number },
  "breadth": { "advances": number, "declines": number, "unchanged": number },
  "timestamp": "ISO date string",
  "marketStatus": "open" | "closed"
}
`;

    const llmRes = await callOpenRouterJSON<any>({
      systemPrompt: FINANCE_DATA_SYSTEM_PROMPT,
      userPrompt,
      temperature: 0,
      maxTokens: 1000,
      enableWebSearch: false, // Disabled for now - web search too slow
    });

    if (!llmRes.ok || !llmRes.data) {
      return NextResponse.json(
        { error: llmRes.error ?? "Failed to fetch market snapshot" },
        { status: 500 }
      );
    }

    const data = llmRes.data;
    
    // Save to both caches
    setInMemoryCache(cacheKey, data);
    try {
      await upsertSnapshotCache(data);
    } catch (dbErr) {
      console.error("DB cache write failed:", dbErr);
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Market snapshot error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
