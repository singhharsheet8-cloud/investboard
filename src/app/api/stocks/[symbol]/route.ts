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

    // Comprehensive prompt to get ALL data from Moneycontrol and other sources
    const userPrompt = `
CRITICAL: Search Moneycontrol (moneycontrol.com), NSE India (nseindia.com), BSE India (bseindia.com), and Screener.in for COMPREHENSIVE data about Indian stock "${symbol}".

You MUST search Moneycontrol directly. Look for the stock's detailed quote page with ALL metrics.

REQUIRED DATA TO EXTRACT:

BASIC INFO:
- Full company name
- Current stock price (₹)
- Today's change amount (₹)
- Today's change percentage (%)
- Sector
- Industry

MARKET DATA:
- Market capitalization (₹ Crores) - CRITICAL
- 52-week high (₹) - CRITICAL
- 52-week low (₹) - CRITICAL
- Current trading volume (number of shares)

VALUATION RATIOS:
- P/E Ratio (Price-to-Earnings) - CRITICAL
- P/B Ratio (Price-to-Book) - CRITICAL
- Dividend Yield (%) - CRITICAL
- ROE (Return on Equity) %
- Debt-to-Equity ratio

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
  "roe": number or null,
  "debtToEquity": number or null,
  "high52w": number,
  "low52w": number,
  "volume": number,
  "sector": "string",
  "industry": "string",
  "timestamp": "ISO date string"
}

SEARCH STRATEGY:
1. Go to Moneycontrol.com and search for stock symbol "${symbol}"
2. Extract ALL available metrics from the stock's detailed page
3. Cross-reference with NSE/BSE if needed
4. Include all metrics found, set to null only if truly unavailable
`;

    const llmRes = await callOpenRouterJSON<any>({
      systemPrompt: FINANCE_DATA_SYSTEM_PROMPT,
      userPrompt,
      temperature: 0,
      maxTokens: 2000,
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
