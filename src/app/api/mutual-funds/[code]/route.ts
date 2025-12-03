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

    // Comprehensive prompt to get ALL metrics from Moneycontrol and Morningstar
    const userPrompt = `
URGENT: You MUST use web search to find COMPREHENSIVE data for Indian mutual fund code "${code}" (Parag Parikh Flexi Cap Fund - Direct Plan - Growth).

SEARCH THESE EXACT URLs:
1. https://www.moneycontrol.com/mutual-funds/nav/parag-parikh-flexi-cap-fund-direct-plan/MPP002
2. https://www.morningstar.in/en/funds/snapshot/s portfolio.aspx?t=0P0000XJ5K (or search for "Parag Parikh Flexi Cap Fund")
3. https://www.valueresearchonline.com/funds/ (search for MPP002 or Parag Parikh)

YOU MUST EXTRACT EVERY SINGLE METRIC AVAILABLE. DO NOT SET TO NULL UNLESS ABSOLUTELY NOT FOUND AFTER SEARCHING ALL THREE SITES.

REQUIRED DATA TO EXTRACT (search thoroughly for each):

BASIC INFO:
- Full fund name (prefer "Direct Plan - Growth" variant)
- Category (Large Cap, Mid Cap, Small Cap, Flexi Cap, ELSS, Dividend Yield, etc.)
- Benchmark index name (e.g., Nifty 100 TRI, BSE 100 TRI)
- Fund manager name(s)
- Current NAV (Net Asset Value)

AUM & EXPENSE:
- AUM (Assets Under Management) in ₹ Crores - CRITICAL
- % Share of Category AUM - CRITICAL
- Expense Ratio (TER %) - CRITICAL

RETURNS (Annualized %):
- 1 Year Return
- 3 Year Return - CRITICAL
- 5 Year Return - CRITICAL
- 10 Year Return (if available)

SIP RETURNS (XIRR %):
- 3 Year SIP Return - CRITICAL
- 5 Year SIP Return - CRITICAL
- 10 Year SIP Return (if available)

RISK METRICS (3 Year):
- Beta (3Y) - CRITICAL
- Volatility / Standard Deviation (3Y %) - CRITICAL
- Sharpe Ratio (3Y) - CRITICAL
- Sortino Ratio (3Y)
- Jensen's Alpha (3Y) - CRITICAL
- Treynor Ratio (3Y) - CRITICAL
- Information Ratio (3Y)
- Maximum Drawdown (3Y %)
- Upside Capture Ratio (3Y)
- Downside Capture Ratio (3Y)

ALLOCATION (%):
- Large Cap Allocation % - CRITICAL
- Mid Cap Allocation % - CRITICAL
- Small Cap Allocation % - CRITICAL
- Top 10 Holdings Concentration % - CRITICAL
- Turnover Ratio %
- % Investment in Category (category exposure)

SECTORS:
- Top 5 Sectors with their weight percentages

Return ONLY a JSON object following this EXACT structure:
{
  "code": "${code}",
  "name": "Full fund name",
  "category": "Category name",
  "benchmark": "Benchmark index name",
  "fundManager": "Fund manager name",
  "nav": number,
  "aum": number (in crores),
  "category_aum_share_percent": number,
  "expenseRatio": number,
  "returns": {
    "1y": number or null,
    "3y": number or null,
    "5y": number or null,
    "10y": number or null
  },
  "sip_returns": {
    "3y": number or null,
    "5y": number or null,
    "10y": number or null
  },
  "risk": {
    "beta_3y": number or null,
    "volatility_stddev_percent": number or null,
    "sharpe_3y": number or null,
    "sortino_3y": number or null,
    "jensen_alpha_3y": number or null,
    "treynor_3y": number or null,
    "information_ratio_3y": number or null,
    "max_drawdown_3y_percent": number or null,
    "upside_capture_3y": number or null,
    "downside_capture_3y": number or null
  },
  "allocation": {
    "large_cap_percent": number or null,
    "mid_cap_percent": number or null,
    "small_cap_percent": number or null,
    "top10_holdings_concentration_percent": number or null,
    "turnover_percent": number or null
  },
  "sectors": [
    { "name": "Sector 1", "weight_percent": number or null },
    { "name": "Sector 2", "weight_percent": number or null },
    { "name": "Sector 3", "weight_percent": number or null },
    { "name": "Sector 4", "weight_percent": number or null },
    { "name": "Sector 5", "weight_percent": number or null }
  ],
  "category_exposure_percent": number or null,
  "timestamp": "ISO date string"
}

SEARCH STRATEGY:
1. Go to Moneycontrol.com and search for fund code "${code}" or fund name
2. Go to Morningstar.in and search for the same fund  
3. Go to ValueResearchOnline.com and search for the same fund
4. Extract ALL available metrics from ALL sources
5. Look for "Risk & Ratios" section, "Portfolio" section, "Performance" section
6. For SIP returns, look for "SIP Returns" or "XIRR" sections
7. For expense ratio, look for "Total Expense Ratio" or "TER"
8. For sectors, look for "Sector Allocation" or "Top Sectors"
9. If a metric is found on ANY site, include it
10. Only set to null if you've searched ALL THREE sites and the metric is genuinely not available

IMPORTANT: Many of these metrics ARE available on these sites. You must search more thoroughly. Look in:
- Fund factsheet PDFs (if linked)
- Detailed performance tables
- Risk metrics sections
- Portfolio analysis sections
- Fund comparison tables

DO NOT GIVE UP EASILY. Search multiple pages on each site.
`;

    const llmRes = await callOpenRouterJSON<any>({
      systemPrompt: FINANCE_DATA_SYSTEM_PROMPT,
      userPrompt,
      temperature: 0,
      maxTokens: 3000,
    });

    // Log raw response for debugging
    if (llmRes.raw?.choices?.[0]?.message?.content) {
      console.log("=== RAW SONAR RESPONSE ===");
      console.log(llmRes.raw.choices[0].message.content);
      console.log("=== END RAW RESPONSE ===");
    }

    if (!llmRes.ok || !llmRes.data) {
      console.error("LLM call failed:", llmRes.error);
      console.error("Raw response:", JSON.stringify(llmRes.raw, null, 2));
      return NextResponse.json(
        { error: llmRes.error ?? "Failed to fetch mutual fund data" },
        { status: 500 }
      );
    }

    const data = llmRes.data;
    console.log("=== PARSED DATA ===");
    console.log(JSON.stringify(data, null, 2));
    console.log("=== END PARSED DATA ===");
    
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
