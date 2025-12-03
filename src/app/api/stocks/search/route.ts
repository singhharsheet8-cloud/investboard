import { NextRequest, NextResponse } from "next/server";
import stocksData from "@/data/stocks.json";

interface StockItem {
  symbol: string;
  name: string;
  sector: string;
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const query = url.searchParams.get("q")?.toLowerCase() || "";
  const sector = url.searchParams.get("sector")?.toLowerCase() || "";

  if (!query && !sector) {
    return NextResponse.json([]);
  }

  const stocks = stocksData as StockItem[];

  let results = stocks;

  // Filter by sector if provided
  if (sector) {
    results = results.filter((stock) => stock.sector === sector);
  }

  // Filter by search query
  if (query) {
    results = results.filter(
      (stock) =>
        stock.name.toLowerCase().includes(query) ||
        stock.symbol.toLowerCase().includes(query)
    );
  }

  // Return top 20 results
  return NextResponse.json(
    results.slice(0, 20).map((stock) => ({
      symbol: stock.symbol,
      name: stock.name,
      sector: stock.sector,
    }))
  );
}
