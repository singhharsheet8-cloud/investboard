import { NextRequest, NextResponse } from "next/server";
import { callOpenRouterJSON } from "@/lib/openrouter-client";
import { FINANCE_DATA_SYSTEM_PROMPT } from "@/lib/prompts";
import { getIPOCache, upsertIPOCache } from "@/lib/db/repositories/ipoRepo";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params;
    const id = decodeURIComponent(rawId);
    const url = req.nextUrl;
    const refresh = url.searchParams.get("refresh") === "true";

    // Check cache first (indefinite caching - no TTL)
    if (!refresh) {
      try {
        const cached = await getIPOCache(id);
        if (cached) {
          return NextResponse.json(cached);
        }
      } catch (cacheErr) {
        console.error("Cache read failed:", cacheErr);
      }
    }

    // Fetch new data via LLM
    const userPrompt = `
Fetch detailed data for the IPO with identifier "${id}".

Include:
- Company profile and business description
- Sector and industry
- Issue open/close dates, listing date
- Price band (low and high)
- Lot size
- GMP (Grey Market Premium) and trends
- Subscription data (QIB, NII, Retail, Total)
- Key financials
- Risk factors
- Listing gain percentage if already listed

Use sources like NSE, BSE, Moneycontrol, Chittorgarh, company DRHP for comprehensive IPO data.

Return ONLY the JSON object following the ipo schema.
`;

    const llmRes = await callOpenRouterJSON<any>({
      systemPrompt: FINANCE_DATA_SYSTEM_PROMPT,
      userPrompt,
      temperature: 0,
      maxTokens: 2000,
    });

    if (!llmRes.ok || !llmRes.data) {
      return NextResponse.json(
        { error: llmRes.error ?? "Failed to fetch IPO data" },
        { status: 500 }
      );
    }

    const data = llmRes.data;
    
    try {
      await upsertIPOCache(id, data);
    } catch (cacheErr) {
      console.error("Cache write failed:", cacheErr);
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
