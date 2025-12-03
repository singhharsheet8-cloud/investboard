import { NextRequest, NextResponse } from "next/server";
import { callOpenRouterJSON } from "@/lib/openrouter-client";
import { FINANCE_DATA_SYSTEM_PROMPT } from "@/lib/prompts";
import { getStockCache, upsertStockCache } from "@/lib/db/repositories/stocksRepo";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol: rawSymbol } = await params;
  const symbol = decodeURIComponent(rawSymbol);
  const url = req.nextUrl;
  const refresh = url.searchParams.get("refresh") === "true";

  // Check cache first (indefinite caching - no TTL)
  if (!refresh) {
    const cached = await getStockCache(symbol);
    if (cached) {
      return NextResponse.json(cached);
    }
  }

  // Fetch new data via LLM
  const userPrompt = `
Fetch detailed data for the Indian stock with symbol or name "${symbol}".

Include:
- Current price, change %, market cap
- P/E, P/B ratios
- Dividend yield, ROE, Debt/Equity
- Sector and industry
- 52-week high/low
- Volume

Use sources like Moneycontrol, NSE, BSE, Screener for accurate data.

Return ONLY the JSON object following the stock schema.
`;

  const llmRes = await callOpenRouterJSON<any>({
    systemPrompt: FINANCE_DATA_SYSTEM_PROMPT,
    userPrompt,
    temperature: 0,
    maxTokens: 1800,
  });

  if (!llmRes.ok || !llmRes.data) {
    return NextResponse.json(
      { error: llmRes.error ?? "Failed to fetch stock data" },
      { status: 500 }
    );
  }

  const data = llmRes.data;
  await upsertStockCache(symbol, data);

  return NextResponse.json(data);
}
