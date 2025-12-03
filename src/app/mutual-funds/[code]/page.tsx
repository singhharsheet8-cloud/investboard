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
import { useMutualFund } from "@/lib/swr-fetchers";
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
  PieChart,
  BarChart3,
  Shield,
  Target,
  Wallet,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

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

// Returns comparison card
function ReturnsCard({
  title,
  returns,
  benchmark,
}: {
  title: string;
  returns: { y3?: number | null; y5?: number | null; y10?: number | null };
  benchmark?: { y3?: number | null; y5?: number | null; y10?: number | null };
}) {
  const periods = [
    { key: "y3", label: "3Y" },
    { key: "y5", label: "5Y" },
    { key: "y10", label: "10Y" },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          {periods.map(({ key, label }) => {
            const val = returns[key as keyof typeof returns];
            const benchVal = benchmark?.[key as keyof typeof benchmark];
            const outperforms = val && benchVal ? val > benchVal : null;

            return (
              <div key={key} className="text-center">
                <p className="text-xs text-muted-foreground mb-1">{label}</p>
                <p
                  className={`text-xl font-bold ${
                    val && val > 0 ? "text-green-600" : val && val < 0 ? "text-red-600" : ""
                  }`}
                >
                  {val !== null && val !== undefined ? `${val.toFixed(2)}%` : "-"}
                </p>
                {benchVal !== null && benchVal !== undefined && (
                  <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    vs {benchVal.toFixed(1)}%
                    {outperforms !== null &&
                      (outperforms ? (
                        <ArrowUpRight className="h-3 w-3 text-green-600" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 text-red-600" />
                      ))}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Risk gauge visualization
function RiskGauge({ label, value, max = 2, tooltip }: { label: string; value: number | null | undefined; max?: number; tooltip?: string }) {
  if (value === null || value === undefined || isNaN(value)) {
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-medium text-muted-foreground">-</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-muted rounded-full" style={{ width: "0%" }} />
        </div>
      </div>
    );
  }
  
  const percentage = Math.min((Math.abs(value) / max) * 100, 100);
  const isGood = value > 0;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">{label}</span>
              <span className={`font-medium ${isGood ? "text-green-600" : "text-amber-600"}`}>
                {typeof value === "number" ? value.toFixed(2) : "-"}
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  isGood ? "bg-green-500" : "bg-amber-500"
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        </TooltipTrigger>
        {tooltip && (
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}

// Allocation pie visualization
function AllocationBar({ data }: { data: { label: string; value: number | null; color: string }[] }) {
  const total = data.reduce((sum, d) => sum + (d.value || 0), 0);
  
  return (
    <div className="space-y-3">
      <div className="h-4 rounded-full overflow-hidden flex">
        {data.map((d, i) => (
          d.value && d.value > 0 && (
            <div
              key={i}
              className={`${d.color} transition-all`}
              style={{ width: `${(d.value / total) * 100}%` }}
            />
          )
        ))}
      </div>
      <div className="flex flex-wrap gap-4">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <div className={`w-3 h-3 rounded ${d.color}`} />
            <span className="text-muted-foreground">{d.label}</span>
            <span className="font-medium">{d.value ? `${d.value.toFixed(1)}%` : "-"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MutualFundDetailPage() {
  const params = useParams();
  const code = params?.code as string;
  const [refreshing, setRefreshing] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [addingToWatchlist, setAddingToWatchlist] = useState(false);
  const { data, error, isLoading, mutate: refetch } = useMutualFund(code);
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
    if (!userId || !code) return;
    const checkWatchlist = async () => {
      try {
        const res = await fetch(`/api/watchlist/items?userId=${encodeURIComponent(userId)}`);
        if (res.ok) {
          const items = await res.json();
          setIsInWatchlist(items.some((item: any) => item.entityType === "mutual_fund" && item.entityKey === code));
        }
      } catch (err) {
        console.error("Error checking watchlist:", err);
      }
    };
    checkWatchlist();
  }, [userId, code]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await mutate(`/api/mutual-funds/${code}?refresh=true`);
    await refetch();
    setRefreshing(false);
  };

  const handleAddToWatchlist = async () => {
    if (!userId || !code) return;
    setAddingToWatchlist(true);
    try {
      const res = await fetch("/api/watchlist/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          entityType: "mutual_fund",
          entityKey: code,
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

  // Extract data from both flat and nested formats - handle API response structure
  const mf = data?.metrics?.mutual_fund || data;
  const name = mf?.entity_name || mf?.name || data?.identifier?.name || data?.name || code;
  const category = mf?.category_name || mf?.category || data?.category;
  const benchmark = mf?.benchmark_name || mf?.benchmark || data?.benchmark;
  const aum = mf?.aum_cr || mf?.aum || data?.aum;
  const expenseRatio = mf?.expense_ratio_percent || mf?.expenseRatio || data?.expenseRatio;
  
  // Returns - handle both nested and flat structures
  const returns = mf?.returns || data?.returns || {};
  const returns1y = returns?.y1 || returns?.["1y"] || data?.returns?.["1y"] || data?.returns?.y1;
  const returns3y = returns?.y3 || returns?.["3y"] || data?.returns?.["3y"] || data?.returns?.y3;
  const returns5y = returns?.y5 || returns?.["5y"] || data?.returns?.["5y"] || data?.returns?.y5;
  const returns10y = returns?.y10 || returns?.["10y"] || data?.returns?.["10y"] || data?.returns?.y10;
  const returnsObj = {
    y1: returns1y,
    y3: returns3y,
    y5: returns5y,
    y10: returns10y,
  };
  
  // SIP Returns
  const sipReturns = mf?.sip_returns || data?.sip_returns || data?.sipReturns || {};
  const sipReturns3y = sipReturns?.y3 || sipReturns?.["3y"] || data?.sip_returns?.["3y"] || data?.sip_returns?.y3;
  const sipReturns5y = sipReturns?.y5 || sipReturns?.["5y"] || data?.sip_returns?.["5y"] || data?.sip_returns?.y5;
  const sipReturns10y = sipReturns?.y10 || sipReturns?.["10y"] || data?.sip_returns?.["10y"] || data?.sip_returns?.y10;
  const sipReturnsObj = {
    y3: sipReturns3y,
    y5: sipReturns5y,
    y10: sipReturns10y,
  };
  
  // Risk metrics - handle both nested and flat, ensure numeric values
  const risk = mf?.risk || data?.risk || {};
  const safeNumber = (val: any): number | null => {
    if (val === null || val === undefined || val === "") return null;
    const num = typeof val === "number" ? val : parseFloat(val);
    return isNaN(num) ? null : num;
  };
  
  const riskObj = {
    beta_3y: safeNumber(risk?.beta_3y || risk?.beta || data?.risk?.beta_3y || data?.risk?.beta),
    volatility_stddev_percent: safeNumber(risk?.volatility_stddev_percent || risk?.volatility || risk?.stdDev || data?.risk?.volatility_stddev_percent),
    sharpe_3y: safeNumber(risk?.sharpe_3y || risk?.sharpe || data?.risk?.sharpe_3y || data?.risk?.sharpe),
    sortino_3y: safeNumber(risk?.sortino_3y || risk?.sortino || data?.risk?.sortino_3y || data?.risk?.sortino),
    jensen_alpha_3y: safeNumber(risk?.jensen_alpha_3y || risk?.jensenAlpha || risk?.jensensAlpha || data?.risk?.jensen_alpha_3y),
    treynor_3y: safeNumber(risk?.treynor_3y || risk?.treynor || data?.risk?.treynor_3y || data?.risk?.treynor),
    information_ratio_3y: safeNumber(risk?.information_ratio_3y || risk?.informationRatio || data?.risk?.information_ratio_3y),
    max_drawdown_3y_percent: safeNumber(risk?.max_drawdown_3y_percent || risk?.maxDrawdown || data?.risk?.max_drawdown_3y_percent),
    upside_capture_3y: safeNumber(risk?.upside_capture_3y || risk?.upsideCapture || data?.risk?.upside_capture_3y),
    downside_capture_3y: safeNumber(risk?.downside_capture_3y || risk?.downsideCapture || data?.risk?.downside_capture_3y),
  };
  
  // Allocation
  const allocation = mf?.allocation || data?.allocation || {};
  const allocationObj = {
    large_cap_percent: allocation?.large_cap_percent || allocation?.largeCapPercent || data?.allocation?.large_cap_percent,
    mid_cap_percent: allocation?.mid_cap_percent || allocation?.midCapPercent || data?.allocation?.mid_cap_percent,
    small_cap_percent: allocation?.small_cap_percent || allocation?.smallCapPercent || data?.allocation?.small_cap_percent,
    top10_holdings_concentration_percent: allocation?.top10_holdings_concentration_percent || allocation?.top10Concentration || data?.allocation?.top10_holdings_concentration_percent,
    turnover_percent: allocation?.turnover_percent || allocation?.turnover || data?.allocation?.turnover_percent,
  };
  
  const sectors = mf?.sectors || data?.sectors || [];
  const categoryExposure = mf?.category_exposure_percent || mf?.categoryExposurePercent || data?.category_exposure_percent || data?.categoryExposurePercent;

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
              <p className="text-red-600 mb-4">Error loading fund data: {error.message}</p>
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
                  {category && (
                    <Badge variant="secondary" className="text-xs">
                      {category}
                    </Badge>
                  )}
                  {benchmark && (
                    <Badge variant="outline" className="text-xs">
                      Benchmark: {benchmark}
                    </Badge>
                  )}
                  <span className="text-sm text-muted-foreground">
                    Code: {code}
                  </span>
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
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                  Refresh Data
                </Button>
              </div>
            </div>

            {/* Key Metrics Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                label="AUM"
                value={formatCurrency(aum)}
                icon={Wallet}
                tooltip="Assets Under Management - Total value of all investments"
                highlight
              />
              <MetricCard
                label="Expense Ratio"
                value={expenseRatio ? `${expenseRatio}%` : "-"}
                icon={Target}
                tooltip="Annual fee charged by the fund (lower is better)"
              />
              <MetricCard
                label="3Y Returns"
                value={formatPercent(returnsObj.y3)}
                trend={returnsObj.y3 && returnsObj.y3 > 0 ? "up" : returnsObj.y3 && returnsObj.y3 < 0 ? "down" : "neutral"}
                icon={TrendingUp}
                tooltip="Annualized returns over 3 years"
                highlight
              />
              <MetricCard
                label="Sharpe Ratio"
                value={formatNumber(riskObj.sharpe_3y)}
                trend={riskObj.sharpe_3y && riskObj.sharpe_3y > 1 ? "up" : "neutral"}
                icon={Shield}
                tooltip="Risk-adjusted return measure (above 1 is good)"
              />
            </div>

            {/* Tabs for detailed sections */}
            <Tabs defaultValue="returns" className="space-y-4">
              <TabsList className="grid grid-cols-4 w-full max-w-lg">
                <TabsTrigger value="returns">Returns</TabsTrigger>
                <TabsTrigger value="risk">Risk</TabsTrigger>
                <TabsTrigger value="allocation">Allocation</TabsTrigger>
                <TabsTrigger value="all">All Data</TabsTrigger>
              </TabsList>

              {/* Returns Tab */}
              <TabsContent value="returns" className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <ReturnsCard title="Lump Sum Returns (Annualized)" returns={returnsObj} />
                  <ReturnsCard title="SIP Returns (XIRR)" returns={sipReturnsObj} />
                </div>

                {/* Detailed Returns Grid */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Returns Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      <MetricCard label="1Y Return" value={formatPercent(returnsObj.y1)} trend={returnsObj.y1 && returnsObj.y1 > 0 ? "up" : "down"} />
                      <MetricCard label="3Y Return" value={formatPercent(returnsObj.y3)} trend={returnsObj.y3 && returnsObj.y3 > 0 ? "up" : "down"} />
                      <MetricCard label="5Y Return" value={formatPercent(returnsObj.y5)} trend={returnsObj.y5 && returnsObj.y5 > 0 ? "up" : "down"} />
                      <MetricCard label="3Y SIP" value={formatPercent(sipReturnsObj.y3)} trend={sipReturnsObj.y3 && sipReturnsObj.y3 > 0 ? "up" : "down"} />
                      <MetricCard label="5Y SIP" value={formatPercent(sipReturnsObj.y5)} trend={sipReturnsObj.y5 && sipReturnsObj.y5 > 0 ? "up" : "down"} />
                      <MetricCard label="10Y SIP" value={formatPercent(sipReturnsObj.y10)} trend={sipReturnsObj.y10 && sipReturnsObj.y10 > 0 ? "up" : "down"} />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Risk Tab */}
              <TabsContent value="risk" className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Risk Ratios */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Risk Ratios (3Y)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <RiskGauge
                        label="Sharpe Ratio"
                        value={riskObj.sharpe_3y}
                        max={2}
                        tooltip="Risk-adjusted return. Higher is better. >1 is good."
                      />
                      <RiskGauge
                        label="Sortino Ratio"
                        value={riskObj.sortino_3y}
                        max={2}
                        tooltip="Similar to Sharpe but only considers downside risk."
                      />
                      <RiskGauge
                        label="Treynor Ratio"
                        value={riskObj.treynor_3y}
                        max={0.3}
                        tooltip="Return per unit of market risk (beta)."
                      />
                      <RiskGauge
                        label="Information Ratio"
                        value={riskObj.information_ratio_3y}
                        max={1}
                        tooltip="Excess return vs benchmark per unit of tracking error."
                      />
                    </CardContent>
                  </Card>

                  {/* Volatility Metrics */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Volatility & Capture Ratios
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <MetricCard
                          label="Beta (3Y)"
                          value={formatNumber(riskObj.beta_3y)}
                          tooltip="Market sensitivity. <1 means less volatile than market."
                        />
                        <MetricCard
                          label="Std Dev (3Y)"
                          value={riskObj.volatility_stddev_percent ? `${riskObj.volatility_stddev_percent}%` : "-"}
                          tooltip="Standard deviation of returns. Lower means less volatile."
                        />
                        <MetricCard
                          label="Max Drawdown"
                          value={riskObj.max_drawdown_3y_percent ? `${riskObj.max_drawdown_3y_percent}%` : "-"}
                          trend="down"
                          tooltip="Largest peak-to-trough decline in 3 years."
                        />
                        <MetricCard
                          label="Jensen's Alpha"
                          value={formatNumber(riskObj.jensen_alpha_3y)}
                          trend={riskObj.jensen_alpha_3y && riskObj.jensen_alpha_3y > 0 ? "up" : "down"}
                          tooltip="Excess return over expected return (CAPM). Positive is good."
                        />
                        <MetricCard
                          label="Upside Capture"
                          value={riskObj.upside_capture_3y ? `${riskObj.upside_capture_3y}%` : "-"}
                          tooltip="% of market gains captured. >100% means outperforms in up markets."
                        />
                        <MetricCard
                          label="Downside Capture"
                          value={riskObj.downside_capture_3y ? `${riskObj.downside_capture_3y}%` : "-"}
                          tooltip="% of market losses captured. <100% means protects in down markets."
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Allocation Tab */}
              <TabsContent value="allocation" className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Market Cap Allocation */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <PieChart className="h-4 w-4" />
                        Market Cap Allocation
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <AllocationBar
                        data={[
                          { label: "Large Cap", value: allocationObj.large_cap_percent, color: "bg-blue-500" },
                          { label: "Mid Cap", value: allocationObj.mid_cap_percent, color: "bg-green-500" },
                          { label: "Small Cap", value: allocationObj.small_cap_percent, color: "bg-amber-500" },
                        ]}
                      />
                    </CardContent>
                  </Card>

                  {/* Portfolio Metrics */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Portfolio Characteristics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <MetricCard
                          label="Top 10 Concentration"
                          value={allocationObj.top10_holdings_concentration_percent ? `${allocationObj.top10_holdings_concentration_percent}%` : "-"}
                          tooltip="% of portfolio in top 10 holdings. Lower means more diversified."
                        />
                        <MetricCard
                          label="Turnover Ratio"
                          value={allocationObj.turnover_percent ? `${allocationObj.turnover_percent}%` : "-"}
                          tooltip="How often the fund trades. Lower usually means lower costs."
                        />
                        <MetricCard
                          label="Category AUM Share"
                          value={categoryExposure ? `${categoryExposure}%` : (data?.category_aum_share_percent ? `${data.category_aum_share_percent}%` : "-")}
                          tooltip="Fund's share of total category AUM."
                        />
                        <MetricCard
                          label="Expense Ratio"
                          value={expenseRatio ? `${expenseRatio}%` : "-"}
                          tooltip="Annual management fee."
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Sector Allocation */}
                {sectors && sectors.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Top Sector Holdings</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {sectors.slice(0, 5).map((sector: any, i: number) => (
                          <div key={i} className="flex items-center justify-between">
                            <span className="text-sm">{sector.name || sector}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full"
                                  style={{ width: `${sector.weight_percent || sector.weightPercent || 0}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium w-12 text-right">
                                {sector.weight_percent || sector.weightPercent ? `${(sector.weight_percent || sector.weightPercent).toFixed(1)}%` : "-"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* All Data Tab (Raw JSON for debugging) */}
              <TabsContent value="all">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Raw Data</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-96">
                      {JSON.stringify(data, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Disclaimer */}
            <p className="text-xs text-muted-foreground text-center pt-4 border-t">
              Data sourced from public sources. Returns are past performance and may not indicate future results.
              Please verify data before investing.
            </p>
          </>
        )}
      </div>
    </AppShell>
  );
}
