"use client";

import { useState, useEffect, useMemo } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Filter, X } from "lucide-react";
import { useStockSearch } from "@/lib/swr-fetchers";
import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useAppStore, useHasHydrated } from "@/lib/store";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import stocksData from "@/data/stocks.json";

// Popular sectors for quick filter
const POPULAR_SECTORS = [
  "it-tech",
  "banking-finance",
  "pharma-healthcare",
  "automobile",
  "infrastructure",
  "energy-power",
  "chemicals",
  "retail",
  "telecom",
  "refineries",
];

// Example stocks to show when no search
const EXAMPLE_STOCKS = [
  { symbol: "RI", name: "Reliance", sector: "refineries" },
  { symbol: "TCS", name: "TCS", sector: "it-tech" },
  { symbol: "HDFC", name: "HDFC Bank", sector: "banking-finance" },
  { symbol: "INFY", name: "Infosys", sector: "it-tech" },
  { symbol: "ICICIBANK", name: "ICICI Bank", sector: "banking-finance" },
  { symbol: "HINDUNILVR", name: "Hindustan Unilever", sector: "retail" },
  { symbol: "ITC", name: "ITC", sector: "cigarettes" },
  { symbol: "SBIN", name: "State Bank of India", sector: "banking-finance" },
  { symbol: "BHARTIARTL", name: "Bharti Airtel", sector: "telecom" },
  { symbol: "LT", name: "Larsen & Toubro", sector: "infrastructure" },
];

export default function StocksPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const { data: searchResults, isLoading } = useStockSearch(debouncedQuery);
  const hasHydrated = useHasHydrated();
  const getOrCreateUserId = useAppStore((state) => state.getOrCreateUserId);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (hasHydrated) {
      setUserId(getOrCreateUserId());
    }
  }, [hasHydrated, getOrCreateUserId]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter stocks by sector from local data
  const filteredStocks = useMemo(() => {
    if (!selectedSector) return [];
    return (stocksData as any[]).filter(
      (stock) => stock.sector === selectedSector
    ).slice(0, 50); // Limit to 50 for performance
  }, [selectedSector]);

  const handleAddToWatchlist = async (symbol: string) => {
    if (!userId) return;
    try {
      await fetch("/api/watchlist/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          entityType: "stock",
          entityKey: symbol,
        }),
      });
      alert("Added to watchlist!");
    } catch (error) {
      console.error("Failed to add to watchlist:", error);
      alert("Failed to add to watchlist");
    }
  };

  const displayStocks = searchQuery
    ? searchResults || []
    : selectedSector
    ? filteredStocks
    : EXAMPLE_STOCKS;

  return (
    <AppShell>
      <div className="space-y-6 pb-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold">Stocks</h1>
          <p className="text-muted-foreground">
            Search and explore Indian stocks. Add your favorites to watchlist.
          </p>
        </div>

        {/* Search Card - Enhanced */}
        <Card className="shadow-lg border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              Search Stocks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search by company name or symbol (e.g., Reliance, TCS, INFY)..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedSector(null); // Clear sector filter when searching
                }}
                className="pl-10 h-12 text-base"
              />
            </div>

            {/* Sector Filters */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  Filter by Sector:
                </span>
                {selectedSector && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedSector(null)}
                    className="h-6 px-2"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {POPULAR_SECTORS.map((sector) => (
                  <Button
                    key={sector}
                    variant={selectedSector === sector ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSelectedSector(sector);
                      setSearchQuery(""); // Clear search when filtering
                    }}
                    className="text-xs"
                  >
                    {sector.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {searchQuery
                  ? "Search Results"
                  : selectedSector
                  ? `${selectedSector.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())} Stocks`
                  : "Popular Stocks"}
                {displayStocks && displayStocks.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {displayStocks.length} {displayStocks.length === 1 ? "stock" : "stocks"}
                  </Badge>
                )}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading && searchQuery ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : displayStocks && displayStocks.length > 0 ? (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Symbol</TableHead>
                      <TableHead className="font-semibold">Company Name</TableHead>
                      <TableHead className="font-semibold">Sector</TableHead>
                      <TableHead className="font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayStocks.map((stock: any) => (
                      <TableRow
                        key={stock.symbol}
                        className="hover:bg-muted/30 transition-colors cursor-pointer"
                      >
                        <TableCell>
                          <Link
                            href={`/stocks/${stock.symbol}`}
                            className="font-semibold hover:underline text-primary font-mono"
                          >
                            {stock.symbol}
                          </Link>
                        </TableCell>
                        <TableCell className="font-medium">{stock.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {stock.sector?.replace(/-/g, " ") || "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToWatchlist(stock.symbol);
                            }}
                            disabled={!userId}
                            className="hover:bg-primary hover:text-primary-foreground"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add to Watchlist
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : searchQuery && searchResults && searchResults.length === 0 ? (
              <EmptyState
                title="No stocks found"
                description={`No stocks found matching "${debouncedQuery}". Try a different search term or browse by sector.`}
              />
            ) : null}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
