import { NextRequest, NextResponse } from "next/server";
import fundsData from "@/data/mutual-funds.json";

interface FundItem {
  code: string;
  name: string;
  category: string;
  planType: string;
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const query = url.searchParams.get("q")?.toLowerCase() || "";
  const category = url.searchParams.get("category")?.toLowerCase() || "";

  if (!query && !category) {
    return NextResponse.json([]);
  }

  const funds = fundsData as FundItem[];

  let results = funds;

  // Filter by category if provided
  if (category) {
    results = results.filter((fund) => fund.category === category);
  }

  // Filter by search query
  if (query) {
    results = results.filter(
      (fund) =>
        fund.name.toLowerCase().includes(query) ||
        fund.code.toLowerCase().includes(query)
    );
  }

  // Return top 20 results
  return NextResponse.json(
    results.slice(0, 20).map((fund) => ({
      code: fund.code,
      name: fund.name,
      category: fund.category,
    }))
  );
}
