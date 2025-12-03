import { NextRequest, NextResponse } from "next/server";
import { callOpenRouterJSON } from "@/lib/openrouter-client";
import { FINANCE_DATA_SYSTEM_PROMPT } from "@/lib/prompts";
import { getMFCache, upsertMFCache } from "@/lib/db/repositories/mutualFundsRepo";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code: rawCode } = await params;
    const code = decodeURIComponent(rawCode);
    const url = req.nextUrl;
    const refresh = url.searchParams.get("refresh") === "true";

    // Check cache first (indefinite caching - no TTL)
    if (!refresh) {
      try {
        const cached = await getMFCache(code);
        if (cached) {
          return NextResponse.json(cached);
        }
      } catch (cacheErr) {
        console.error("Cache read failed:", cacheErr);
      }
    }

    // Fetch new data via LLM
    const userPrompt = `
Fetch detailed data for the Indian mutual fund with code or name "${code}".

- Prefer Direct Plan - Growth if multiple share classes exist.
- Use sources like Moneycontrol, ValueResearch, Morningstar, AMFI.
- Fill all mutual fund fields exactly as defined in the system JSON schema.
- Set entity_type = "mutual_fund" for the fund.
- If a metric is unavailable or unreliable, set its value to null.

Return ONLY the JSON object.
`;

    const llmRes = await callOpenRouterJSON<any>({
      systemPrompt: FINANCE_DATA_SYSTEM_PROMPT,
      userPrompt,
      temperature: 0,
      maxTokens: 1800,
    });

    if (!llmRes.ok || !llmRes.data) {
      return NextResponse.json(
        { error: llmRes.error ?? "Failed to fetch mutual fund data" },
        { status: 500 }
      );
    }

    const data = llmRes.data;
    
    try {
      await upsertMFCache(code, data);
    } catch (cacheErr) {
      console.error("Cache write failed:", cacheErr);
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
