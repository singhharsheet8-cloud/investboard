import { NextRequest, NextResponse } from "next/server";
import { callOpenRouterJSON } from "@/lib/openrouter-client";
import { FINANCE_DATA_SYSTEM_PROMPT } from "@/lib/prompts";
import { prisma } from "@/lib/db/prisma";

const UPCOMING_IPO_KEY = "upcoming";

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const refresh = url.searchParams.get("refresh") === "true";

  // Check cache first (indefinite caching - no TTL)
  if (!refresh) {
    const cached = await prisma.cachedEntity.findUnique({
      where: {
        entityType_key: {
          entityType: "ipo",
          key: UPCOMING_IPO_KEY,
        },
      },
    });

    if (cached) {
      const data = cached.data as any;
      return NextResponse.json(Array.isArray(data) ? data : [data]);
    }
  }

  // Fetch new data via LLM
  const userPrompt = `
Fetch list of upcoming IPOs in India (scheduled to open in the near future).

For each IPO, include:
- Company name, sector
- Expected issue open date, issue close date
- Price band (low and high) if announced
- Lot size if announced
- GMP (Grey Market Premium) if available

Use sources like NSE, BSE, Moneycontrol, Chittorgarh for upcoming IPO listings.

Return a JSON array of IPO objects following the ipo schema.
`;

  const llmRes = await callOpenRouterJSON<any>({
    systemPrompt: FINANCE_DATA_SYSTEM_PROMPT,
    userPrompt,
    temperature: 0,
    maxTokens: 2000,
  });

  if (!llmRes.ok || !llmRes.data) {
    return NextResponse.json(
      { error: llmRes.error ?? "Failed to fetch upcoming IPOs" },
      { status: 500 }
    );
  }

  const data = Array.isArray(llmRes.data) ? llmRes.data : [llmRes.data];

  await prisma.cachedEntity.upsert({
    where: {
      entityType_key: {
        entityType: "ipo",
        key: UPCOMING_IPO_KEY,
      },
    },
    update: {
      data: data as any,
      fetchedAt: new Date(),
      updatedAt: new Date(),
    },
    create: {
      entityType: "ipo",
      key: UPCOMING_IPO_KEY,
      data: data as any,
      sourceUrls: [],
      fetchedAt: new Date(),
    },
  });

  return NextResponse.json(data);
}

