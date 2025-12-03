import { NextRequest, NextResponse } from "next/server";

// Increase function timeout for LLM calls with web search
export const maxDuration = 60;
import { callOpenRouterJSON } from "@/lib/openrouter-client";
import { FINANCE_DATA_SYSTEM_PROMPT } from "@/lib/prompts";
import { getMFCache, upsertMFCache } from "@/lib/db/repositories/mutualFundsRepo";
import { getFromMemoryCache, setInMemoryCache, cacheKeys } from "@/lib/cache";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code: rawCode } = await params;
    const code = decodeURIComponent(rawCode);
    const url = req.nextUrl;
    const refresh = url.searchParams.get("refresh") === "true";
    const cacheKey = cacheKeys.mutualFund(code);

    // Check cache first
    if (!refresh) {
      try {
        const cached = await getMFCache(code);
        if (cached) {
          return NextResponse.json(cached);
        }
      } catch (dbErr) {
        console.error("DB cache read failed:", dbErr);
      }
      
      const memoryCached = getFromMemoryCache(cacheKey);
      if (memoryCached) {
        return NextResponse.json(memoryCached);
      }
    }

    // Fetch new data via LLM with web search
    const userPrompt = `
Search the web for detailed data about Indian mutual fund with code "${code}".

Use Moneycontrol, ValueResearch, Morningstar India, AMFI for:
- Fund name (prefer Direct Plan - Growth variant)
- Category (Large Cap, Mid Cap, Small Cap, Flexi Cap, ELSS, etc.)
- AUM (Assets Under Management) in crores
- Expense ratio %
- NAV (Net Asset Value)
- Returns: 1 year, 3 year, 5 year
- Risk metrics: Standard deviation, Sharpe ratio, Beta
- Fund manager name
- Benchmark index
- Top holdings (if available)

Return ONLY a JSON object:
{
  "code": "${code}",
  "name": "Full fund name",
  "category": "Category name",
  "aum": number (in crores),
  "expenseRatio": number,
  "nav": number,
  "returns": {
    "1y": number or null,
    "3y": number or null,
    "5y": number or null
  },
  "risk": {
    "stdDev": number or null,
    "sharpe": number or null,
    "beta": number or null
  },
  "fundManager": "string",
  "benchmark": "string",
  "topHoldings": ["holding1", "holding2", ...] or [],
  "timestamp": "ISO date string"
}
`;

    const llmRes = await callOpenRouterJSON<any>({
      systemPrompt: FINANCE_DATA_SYSTEM_PROMPT,
      userPrompt,
      temperature: 0,
      maxTokens: 2000,
    });

    if (!llmRes.ok || !llmRes.data) {
      return NextResponse.json(
        { error: llmRes.error ?? "Failed to fetch mutual fund data" },
        { status: 500 }
      );
    }

    const data = llmRes.data;
    
    setInMemoryCache(cacheKey, data);
    try {
      await upsertMFCache(code, data);
    } catch (dbErr) {
      console.error("DB cache write failed:", dbErr);
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Mutual fund fetch error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
