import { NextRequest, NextResponse } from "next/server";
import { callOpenRouterJSON } from "@/lib/openrouter-client";
import { FINANCE_DATA_SYSTEM_PROMPT } from "@/lib/prompts";
import { prisma } from "@/lib/db/prisma";

const CURRENT_IPO_KEY = "current";

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const refresh = url.searchParams.get("refresh") === "true";

  // Check cache first (indefinite caching - no TTL)
  if (!refresh) {
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
  }

  // Fetch new data via LLM
  const userPrompt = `
Fetch list of currently open IPOs in India.

For each IPO, include:
- Company name, sector
- Issue open date, issue close date
- Price band (low and high)
- Lot size
- GMP (Grey Market Premium) if available
- Subscription data if available

Use sources like NSE, BSE, Moneycontrol, Chittorgarh for current IPO listings.

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
      { error: llmRes.error ?? "Failed to fetch current IPOs" },
      { status: 500 }
    );
  }

  const data = Array.isArray(llmRes.data) ? llmRes.data : [llmRes.data];

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

  return NextResponse.json(data);
}

