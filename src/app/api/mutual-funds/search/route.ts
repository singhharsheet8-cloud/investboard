import { NextRequest, NextResponse } from "next/server";
import fundsData from "@/data/mutual-funds.json";

interface FundItem {
  fundName: string;
  schemeCode: string;
  url: string;
  planType: string;
  category: string;
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const query = url.searchParams.get("q")?.toLowerCase() || "";

  if (!query) {
    return NextResponse.json([]);
  }

  const funds = fundsData as FundItem[];

  // Filter to only Direct Plan funds and deduplicate by schemeCode
  const directFunds = funds
    .filter((fund) => fund.planType === "Direct Plan")
    .reduce((acc, fund) => {
      if (!acc.find((f) => f.schemeCode === fund.schemeCode)) {
        acc.push(fund);
      }
      return acc;
    }, [] as FundItem[]);

  const results = directFunds
    .filter(
      (fund) =>
        fund.fundName.toLowerCase().includes(query) ||
        fund.schemeCode.toLowerCase().includes(query)
    )
    .slice(0, 20) // Limit to 20 results
    .map((fund) => ({
      code: fund.schemeCode,
      name: fund.fundName,
      category: fund.category,
    }));

  return NextResponse.json(results);
}

