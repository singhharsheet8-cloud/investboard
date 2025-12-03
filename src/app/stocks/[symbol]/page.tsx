"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useStock } from "@/lib/swr-fetchers";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { mutate } from "swr";
import { useAppStore, useHasHydrated } from "@/lib/store";
import { Star, Check } from "lucide-react";
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Info,
  Wallet,
  BarChart3,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Activity,
  Target,
  Shield,
} from "lucide-react";
import { PriceLineChart } from "@/components/charts/PriceLineChart";

// Helper to format numbers
const formatNumber = (val: number | null | undefined, decimals = 2) => {
  if (val === null || val === undefined) return "-";
  return val.toLocaleString("en-IN", { maximumFractionDigits: decimals });
};

const formatPercent = (val: number | null | undefined) => {
  if (val === null || val === undefined) return "-";
  const prefix = val >= 0 ? "+" : "";
  return `${prefix}${val.toFixed(2)}%`;
};

const formatCurrency = (val: number | null | undefined) => {
  if (val === null || val === undefined) return "-";
  if (val >= 10000) return `₹${(val / 1000).toFixed(1)}K Cr`;
  return `₹${formatNumber(val)} Cr`;
};

// Metric card with tooltip
function MetricCard({
  label,
  value,
  tooltip,
  trend,
  icon: Icon,
  highlight,
}: {
  label: string;
  value: string | number;
  tooltip?: string;
  trend?: "up" | "down" | "neutral";
  icon?: any;
  highlight?: boolean;
}) {
  const trendColor =
    trend === "up"
      ? "text-green-600"
      : trend === "down"
      ? "text-red-600"
      : "text-foreground";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`p-4 rounded-lg border ${
              highlight ? "bg-primary/5 border-primary/20" : "bg-card"
            } hover:shadow-md transition-all cursor-help`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                {Icon && <Icon className="h-3 w-3" />}
                {label}
              </span>
              {tooltip && <Info className="h-3 w-3 text-muted-foreground" />}
            </div>
            <p className={`text-lg font-bold ${trendColor}`}>{value}</p>
          </div>
        </TooltipTrigger>
        {tooltip && (
          <TooltipContent className="max-w-xs">
            <p>{tooltip}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}

export default function StockDetailPage() {
  const params = useParams();
  const symbol = params?.symbol as string;
  const [refreshing, setRefreshing] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [addingToWatchlist, setAddingToWatchlist] = useState(false);
  const [pricePeriod, setPricePeriod] = useState<"1D" | "1W" | "1M" | "1Y" | "5Y">("1Y");
  const { data, error, isLoading, mutate: refetch } = useStock(symbol);
  const hasHydrated = useHasHydrated();
  const getOrCreateUserId = useAppStore((state) => state.getOrCreateUserId);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (hasHydrated) {
      setUserId(getOrCreateUserId());
    }
  }, [hasHydrated, getOrCreateUserId]);

  // Check if already in watchlist
  useEffect(() => {
    if (!userId || !symbol) return;
    const checkWatchlist = async () => {
      try {
        const res = await fetch(`/api/watchlist/items?userId=${encodeURIComponent(userId)}`);
        if (res.ok) {
          const items = await res.json();
          setIsInWatchlist(items.some((item: any) => item.entityType === "stock" && item.entityKey === symbol));
        }
      } catch (err) {
        console.error("Error checking watchlist:", err);
      }
    };
    checkWatchlist();
  }, [userId, symbol]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await mutate(`/api/stocks/${symbol}?refresh=true`);
    await refetch();
    setRefreshing(false);
  };

  const handleAddToWatchlist = async () => {
    if (!userId || !symbol) return;
    setAddingToWatchlist(true);
    try {
      const res = await fetch("/api/watchlist/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          entityType: "stock",
          entityKey: symbol,
        }),
      });
      if (res.ok) {
        setIsInWatchlist(true);
        await mutate(`/api/watchlist/items?userId=${encodeURIComponent(userId)}`);
      } else {
        const error = await res.json();
        alert(error.error || "Failed to add to watchlist");
      }
    } catch (err) {
      console.error("Failed to add to watchlist:", err);
      alert("Failed to add to watchlist");
    } finally {
      setAddingToWatchlist(false);
    }
  };

  // Extract data from both flat and nested formats
  const stock = data?.metrics?.stock || data;
  const name = stock?.entity_name || stock?.name || data?.identifier?.name || symbol;
  const sector = stock?.sector || data?.sector;
  const industry = stock?.industry || data?.industry;
  const price = stock?.price || stock?.current_price;
  const change = stock?.change || stock?.change_amount;
  const changePercent = stock?.changePercent || stock?.change_percent;
  const marketCap = stock?.marketCap || stock?.market_cap_cr;
  const pe = stock?.pe || stock?.pe_ratio;
  const pb = stock?.pb || stock?.pb_ratio;
  const dividendYield = stock?.dividendYield || stock?.dividend_yield_percent;
  const high52w = stock?.high52w || stock?.high_52w;
  const low52w = stock?.low52w || stock?.low_52w;
  const volume = stock?.volume || stock?.trading_volume;
  const priceHistory = stock?.priceHistory || stock?.price_history || [];

  // Generate mock price history if not available
  const chartData = priceHistory.length > 0
    ? priceHistory.map((p: any) => ({
        date: p.date || p.timestamp,
        price: p.price || p.value,
      }))
    : price
    ? [
        { date: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(), price: price * 0.8 },
        { date: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(), price: price * 0.9 },
        { date: new Date().toISOString(), price },
      ]
    : [];

  return (
    <AppShell>
      <div className="space-y-6 pb-8">
        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-12 w-96" />
            <Skeleton className="h-6 w-48" />
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
            <CardContent className="py-8 text-center">
              <p className="text-red-600 mb-4">Error loading stock data: {error.message}</p>
              <Button onClick={handleRefresh} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        {data && !isLoading && (
          <>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">{name}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge variant="secondary" className="text-xs font-mono">
                    {symbol}
                  </Badge>
                  {sector && (
                    <Badge variant="outline" className="text-xs">
                      {sector}
                    </Badge>
                  )}
                  {industry && (
                    <Badge variant="outline" className="text-xs">
                      {industry}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={isInWatchlist ? "default" : "outline"}
                  size="sm"
                  onClick={handleAddToWatchlist}
                  disabled={addingToWatchlist || isInWatchlist || !userId}
                >
                  {isInWatchlist ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      In Watchlist
                    </>
                  ) : (
                    <>
                      <Star className="h-4 w-4 mr-2" />
                      {addingToWatchlist ? "Adding..." : "Add to Watchlist"}
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Price Summary */}
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Current Price</p>
                    <p className="text-3xl font-bold">
                      {price ? `₹${formatNumber(price, 2)}` : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Change</p>
                    <p
                      className={`text-2xl font-bold ${
                        changePercent && changePercent >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {changePercent !== null && changePercent !== undefined
                        ? formatPercent(changePercent)
                        : change
                        ? `₹${formatNumber(change)}`
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Market Cap</p>
                    <p className="text-2xl font-bold">{formatCurrency(marketCap)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                label="P/E Ratio"
                value={pe ? formatNumber(pe, 2) : "-"}
                tooltip="Price-to-Earnings ratio indicates how much investors are willing to pay per rupee of earnings"
                icon={BarChart3}
                trend={pe && pe < 20 ? "neutral" : pe && pe < 30 ? "up" : "down"}
              />
              <MetricCard
                label="P/B Ratio"
                value={pb ? formatNumber(pb, 2) : "-"}
                tooltip="Price-to-Book ratio compares market price to book value per share"
                icon={Target}
                trend={pb && pb < 3 ? "neutral" : "up"}
              />
              <MetricCard
                label="Dividend Yield"
                value={dividendYield ? `${formatNumber(dividendYield, 2)}%` : "-"}
                tooltip="Annual dividend payment as percentage of stock price"
                icon={Percent}
                trend={dividendYield && dividendYield > 2 ? "up" : "neutral"}
              />
              <MetricCard
                label="52W High"
                value={high52w ? `₹${formatNumber(high52w, 2)}` : "-"}
                tooltip="Highest price in the last 52 weeks"
                icon={TrendingUp}
              />
              <MetricCard
                label="52W Low"
                value={low52w ? `₹${formatNumber(low52w, 2)}` : "-"}
                tooltip="Lowest price in the last 52 weeks"
                icon={TrendingDown}
              />
              <MetricCard
                label="Volume"
                value={volume ? formatNumber(volume, 0) : "-"}
                tooltip="Number of shares traded today"
                icon={Activity}
              />
              {price && high52w && low52w && (
                <MetricCard
                  label="52W Range"
                  value={`${formatPercent(((price - low52w) / (high52w - low52w)) * 100)}`}
                  tooltip="Current price position within 52-week range"
                  icon={BarChart3}
                />
              )}
            </div>

            {/* Price Chart */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Price Chart</CardTitle>
                  <Tabs value={pricePeriod} onValueChange={(v) => setPricePeriod(v as any)}>
                    <TabsList>
                      <TabsTrigger value="1D">1D</TabsTrigger>
                      <TabsTrigger value="1W">1W</TabsTrigger>
                      <TabsTrigger value="1M">1M</TabsTrigger>
                      <TabsTrigger value="1Y">1Y</TabsTrigger>
                      <TabsTrigger value="5Y">5Y</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent>
                <PriceLineChart data={chartData} period={pricePeriod} />
              </CardContent>
            </Card>

            {/* Additional Details */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="financials">Financials</TabsTrigger>
                <TabsTrigger value="ratios">Ratios</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Company Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Sector</p>
                        <p className="font-medium">{sector || "-"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Industry</p>
                        <p className="font-medium">{industry || "-"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Symbol</p>
                        <p className="font-mono font-medium">{symbol}</p>
                      </div>
                      {data?.timestamp && (
                        <div>
                          <p className="text-sm text-muted-foreground">Last Updated</p>
                          <p className="font-medium">
                            {new Date(data.timestamp).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="financials" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Financial Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <MetricCard
                        label="Market Cap"
                        value={formatCurrency(marketCap)}
                        tooltip="Total market value of all outstanding shares"
                        icon={Wallet}
                        highlight
                      />
                      <MetricCard
                        label="P/E Ratio"
                        value={pe ? formatNumber(pe, 2) : "-"}
                        tooltip="Price-to-Earnings ratio"
                        icon={BarChart3}
                      />
                      <MetricCard
                        label="P/B Ratio"
                        value={pb ? formatNumber(pb, 2) : "-"}
                        tooltip="Price-to-Book ratio"
                        icon={Target}
                      />
                      <MetricCard
                        label="Dividend Yield"
                        value={dividendYield ? `${formatNumber(dividendYield, 2)}%` : "-"}
                        tooltip="Annual dividend yield"
                        icon={Percent}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="ratios" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Valuation Ratios</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <MetricCard
                        label="P/E Ratio"
                        value={pe ? formatNumber(pe, 2) : "-"}
                        tooltip="Price-to-Earnings ratio"
                        icon={BarChart3}
                      />
                      <MetricCard
                        label="P/B Ratio"
                        value={pb ? formatNumber(pb, 2) : "-"}
                        tooltip="Price-to-Book ratio"
                        icon={Target}
                      />
                      <MetricCard
                        label="Dividend Yield"
                        value={dividendYield ? `${formatNumber(dividendYield, 2)}%` : "-"}
                        tooltip="Annual dividend yield"
                        icon={Percent}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </AppShell>
  );
}
