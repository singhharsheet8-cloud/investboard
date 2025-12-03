import { NextRequest, NextResponse } from "next/server";
import stocksData from "@/data/stocks.json";

interface StockItem {
  symbol: string;
  companyName: string;
  url: string;
  sector: string;
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const query = url.searchParams.get("q")?.toLowerCase() || "";

  if (!query) {
    return NextResponse.json([]);
  }

  const stocks = stocksData as StockItem[];

  const results = stocks
    .filter(
      (stock) =>
        stock.companyName.toLowerCase().includes(query) ||
        stock.symbol.toLowerCase().includes(query)
    )
    .slice(0, 20) // Limit to 20 results
    .map((stock) => ({
      symbol: stock.symbol,
      name: stock.companyName,
      sector: stock.sector,
    }));

  return NextResponse.json(results);
}

