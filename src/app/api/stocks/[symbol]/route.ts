import { NextRequest, NextResponse } from "next/server";

// Increase function timeout for LLM calls with web search
export const maxDuration = 60;
import { callOpenRouterJSON } from "@/lib/openrouter-client";
import { FINANCE_DATA_SYSTEM_PROMPT } from "@/lib/prompts";
import { getStockCache, upsertStockCache } from "@/lib/db/repositories/stocksRepo";
import { getFromMemoryCache, setInMemoryCache, cacheKeys } from "@/lib/cache";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol: rawSymbol } = await params;
    const symbol = decodeURIComponent(rawSymbol).toUpperCase();
    const url = req.nextUrl;
    const refresh = url.searchParams.get("refresh") === "true";
    const cacheKey = cacheKeys.stock(symbol);

    // Check cache first
    if (!refresh) {
      try {
        const cached = await getStockCache(symbol);
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
Search the web for CURRENT data about Indian stock "${symbol}".

Find from NSE, BSE, Moneycontrol, Screener, Economic Times:
- Current stock price
- Today's change and change %
- Market capitalization
- P/E ratio, P/B ratio
- Dividend yield %
- 52-week high and low
- Trading volume
- Sector and industry
- Company full name

Return ONLY a JSON object:
{
  "symbol": "${symbol}",
  "name": "Full company name",
  "price": number,
  "change": number,
  "changePercent": number,
  "marketCap": number (in crores),
  "pe": number or null,
  "pb": number or null,
  "dividendYield": number or null,
  "high52w": number,
  "low52w": number,
  "volume": number,
  "sector": "string",
  "industry": "string",
  "timestamp": "ISO date string"
}
`;

    const llmRes = await callOpenRouterJSON<any>({
      systemPrompt: FINANCE_DATA_SYSTEM_PROMPT,
      userPrompt,
      temperature: 0,
      maxTokens: 1800,
      enableWebSearch: true,
    });

    if (!llmRes.ok || !llmRes.data) {
      return NextResponse.json(
        { error: llmRes.error ?? "Failed to fetch stock data" },
        { status: 500 }
      );
    }

    const data = llmRes.data;
    
    setInMemoryCache(cacheKey, data);
    try {
      await upsertStockCache(symbol, data);
    } catch (dbErr) {
      console.error("DB cache write failed:", dbErr);
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Stock fetch error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
