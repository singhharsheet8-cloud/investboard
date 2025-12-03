import { NextRequest, NextResponse } from "next/server";

// Increase function timeout for LLM calls with web search
export const maxDuration = 60;
import { callOpenRouterJSON } from "@/lib/openrouter-client";
import { FINANCE_DATA_SYSTEM_PROMPT } from "@/lib/prompts";
import { prisma } from "@/lib/db/prisma";
import { getFromMemoryCache, setInMemoryCache, cacheKeys } from "@/lib/cache";

const CURRENT_IPO_KEY = "current";

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl;
    const refresh = url.searchParams.get("refresh") === "true";
    const cacheKey = cacheKeys.ipoList("current");

    // Check cache first
    if (!refresh) {
      try {
        const cached = await prisma.cachedEntity.findUnique({
          where: {
            entityType_key: {
              entityType: "ipo",
              key: CURRENT_IPO_KEY,
            },
          },
        });

        if (cached) {
          const data = cached.data as any;
          return NextResponse.json(Array.isArray(data) ? data : [data]);
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
Search the web for CURRENTLY OPEN IPOs in India as of today.

Use NSE, BSE, Moneycontrol, Chittorgarh IPO for current IPO listings.

For each currently open IPO, get:
- Company name
- Sector/Industry
- Issue open date and close date
- Price band (low and high in INR)
- Lot size
- Grey Market Premium (GMP) if available
- Issue size in crores
- Subscription status (times subscribed) if available

Return ONLY a JSON array:
[
  {
    "name": "Company Name",
    "sector": "Sector",
    "issueOpen": "YYYY-MM-DD",
    "issueClose": "YYYY-MM-DD",
    "priceLow": number,
    "priceHigh": number,
    "lotSize": number,
    "gmp": number or null,
    "issueSize": number (in crores),
    "subscription": number or null (times subscribed)
  }
]

If no IPOs are currently open, return an empty array: []
`;

    const llmRes = await callOpenRouterJSON<any>({
      systemPrompt: FINANCE_DATA_SYSTEM_PROMPT,
      userPrompt,
      temperature: 0,
      maxTokens: 2000,
      enableWebSearch: true,
    });

    if (!llmRes.ok || !llmRes.data) {
      return NextResponse.json(
        { error: llmRes.error ?? "Failed to fetch current IPOs" },
        { status: 500 }
      );
    }

    const data = Array.isArray(llmRes.data) ? llmRes.data : [llmRes.data];
    
    setInMemoryCache(cacheKey, data);
    try {
      await prisma.cachedEntity.upsert({
        where: {
          entityType_key: {
            entityType: "ipo",
            key: CURRENT_IPO_KEY,
          },
        },
        update: {
          data: data as any,
          fetchedAt: new Date(),
          updatedAt: new Date(),
        },
        create: {
          entityType: "ipo",
          key: CURRENT_IPO_KEY,
          data: data as any,
          sourceUrls: [],
          fetchedAt: new Date(),
        },
      });
    } catch (dbErr) {
      console.error("DB cache write failed:", dbErr);
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Current IPO fetch error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
