import { NextRequest, NextResponse } from "next/server";

// Increase function timeout for LLM calls with web search
export const maxDuration = 60;
import { callOpenRouterJSON } from "@/lib/openrouter-client";
import { FINANCE_DATA_SYSTEM_PROMPT } from "@/lib/prompts";
import { getIPOCache, upsertIPOCache } from "@/lib/db/repositories/ipoRepo";
import { getFromMemoryCache, setInMemoryCache, cacheKeys } from "@/lib/cache";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params;
    const id = decodeURIComponent(rawId);
    const url = req.nextUrl;
    const refresh = url.searchParams.get("refresh") === "true";
    const cacheKey = cacheKeys.ipo(id);

    // Check cache first (DB then memory)
    if (!refresh) {
      try {
        const cached = await getIPOCache(id);
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

    // Comprehensive prompt to get ALL IPO data
    const userPrompt = `
CRITICAL: Search Moneycontrol (moneycontrol.com), NSE India (nseindia.com), BSE India (bseindia.com), and Chittorgarh (chittorgarh.com) for COMPREHENSIVE data about IPO with identifier "${id}".

You MUST search Moneycontrol and Chittorgarh directly. Look for the IPO's detailed page.

REQUIRED DATA TO EXTRACT:

BASIC INFO:
- Company full name - CRITICAL
- Sector
- Industry
- Business description

IPO DETAILS:
- Issue open date (YYYY-MM-DD) - CRITICAL
- Issue close date (YYYY-MM-DD) - CRITICAL
- Listing date (YYYY-MM-DD) if already listed
- Price band low (₹) - CRITICAL
- Price band high (₹) - CRITICAL
- Lot size (number of shares) - CRITICAL
- Issue size (₹ Crores) - CRITICAL

MARKET DATA:
- Grey Market Premium (GMP) in ₹ - CRITICAL if available
- Subscription times (QIB, NII, Retail, Total) - CRITICAL
- Listing gain % (if already listed)

Return ONLY a JSON object:
{
  "name": "Company full name",
  "companyName": "Company full name",
  "sector": "string or null",
  "industry": "string or null",
  "issueOpen": "YYYY-MM-DD or null",
  "issueClose": "YYYY-MM-DD or null",
  "listingDate": "YYYY-MM-DD or null",
  "priceLow": number or null,
  "priceHigh": number or null,
  "priceBandLow": number or null,
  "priceBandHigh": number or null,
  "lotSize": number or null,
  "gmp": number or null,
  "issueSize": number (in crores) or null,
  "subscription": number (times subscribed) or null,
  "subscriptionQIB": number or null,
  "subscriptionNII": number or null,
  "subscriptionRetail": number or null,
  "listingGainPercent": number or null,
  "timestamp": "ISO date string"
}

SEARCH STRATEGY:
1. Go to Moneycontrol.com and search for IPO "${id}" or company name
2. Go to Chittorgarh.com and search for the IPO
3. Extract ALL available data from both sources
4. Include company name - this is CRITICAL, do not return just the ID
`;

    const llmRes = await callOpenRouterJSON<any>({
      systemPrompt: FINANCE_DATA_SYSTEM_PROMPT,
      userPrompt,
      temperature: 0,
      maxTokens: 2500,
    });

    if (!llmRes.ok || !llmRes.data) {
      return NextResponse.json(
        { error: llmRes.error ?? "Failed to fetch IPO data" },
        { status: 500 }
      );
    }

    const data = llmRes.data;
    
    // Save to both caches
    setInMemoryCache(cacheKey, data);
    try {
      await upsertIPOCache(id, data);
    } catch (dbErr) {
      console.error("DB cache write failed:", dbErr);
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("IPO fetch error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
