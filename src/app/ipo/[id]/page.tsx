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
import { useIPO } from "@/lib/swr-fetchers";
import { useParams } from "next/navigation";
import { useState } from "react";
import { mutate } from "swr";
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Info,
  Calendar,
  Wallet,
  BarChart3,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Activity,
  Target,
  Shield,
  Users,
  FileText,
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

export default function IPODetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [refreshing, setRefreshing] = useState(false);
  const { data, error, isLoading, mutate: refetch } = useIPO(id);

  const handleRefresh = async () => {
    setRefreshing(true);
    await mutate(`/api/ipo/${id}?refresh=true`);
    await refetch();
    setRefreshing(false);
  };

  // Extract data from both flat and nested formats - handle API response structure
  const ipo = data?.metrics?.ipo || data;
  const name = ipo?.companyName || ipo?.name || data?.name || data?.identifier?.name || id;
  const sector = ipo?.sector || data?.sector;
  const industry = ipo?.industry || data?.industry;
  const priceLow = ipo?.priceBandLow || ipo?.priceLow || ipo?.price_band_low || data?.priceLow || data?.priceBandLow;
  const priceHigh = ipo?.priceBandHigh || ipo?.priceHigh || ipo?.price_band_high || data?.priceHigh || data?.priceBandHigh;
  const issueOpen = ipo?.issueOpen || ipo?.issue_open_date || data?.issueOpen || data?.issue_open;
  const issueClose = ipo?.issueClose || ipo?.issue_close_date || data?.issueClose || data?.issue_close;
  const listingDate = ipo?.listingDate || ipo?.listing_date || data?.listingDate || data?.listing_date;
  const lotSize = ipo?.lotSize || ipo?.lot_size || data?.lotSize || data?.lot_size;
  const gmp = ipo?.gmp || ipo?.grey_market_premium || data?.gmp;
  const issueSize = ipo?.issueSize || ipo?.issue_size_cr || data?.issueSize || data?.issue_size;
  const listingGain = ipo?.listingGainPercent || ipo?.listing_gain_percent || data?.listingGainPercent || data?.listing_gain_percent;
  const subscription = ipo?.subscription || ipo?.subscription_times || data?.subscription;
  const qib = ipo?.subscriptionQIB || ipo?.subscription_qib || data?.subscriptionQIB || data?.subscription_qib;
  const nii = ipo?.subscriptionNII || ipo?.subscription_nii || data?.subscriptionNII || data?.subscription_nii;
  const retail = ipo?.subscriptionRetail || ipo?.subscription_retail || data?.subscriptionRetail || data?.subscription_retail;

  const isOpen = issueOpen && issueClose
    ? new Date() >= new Date(issueOpen) && new Date() <= new Date(issueClose)
    : false;
  const isUpcoming = issueOpen ? new Date() < new Date(issueOpen) : false;
  const isListed = listingDate ? new Date() >= new Date(listingDate) : false;

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
              <p className="text-red-600 mb-4">Error loading IPO data: {error.message}</p>
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
                  {isOpen && (
                    <Badge className="bg-green-600 text-white">Open Now</Badge>
                  )}
                  {isUpcoming && (
                    <Badge className="bg-blue-600 text-white">Upcoming</Badge>
                  )}
                  {isListed && (
                    <Badge className="bg-gray-600 text-white">Listed</Badge>
                  )}
                  {sector && (
                    <Badge variant="secondary" className="text-xs">
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

            {/* Price Summary */}
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Price Band</p>
                    <p className="text-3xl font-bold">
                      {priceLow && priceHigh
                        ? `₹${formatNumber(priceLow)} - ₹${formatNumber(priceHigh)}`
                        : priceLow
                        ? `₹${formatNumber(priceLow)}`
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Grey Market Premium</p>
                    <p
                      className={`text-2xl font-bold ${
                        gmp && gmp >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {gmp !== null && gmp !== undefined
                        ? `₹${formatNumber(gmp)}`
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Issue Size</p>
                    <p className="text-2xl font-bold">{formatCurrency(issueSize)}</p>
                  </div>
                </div>
                {listingGain !== null && listingGain !== undefined && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-1">Listing Gain</p>
                    <p
                      className={`text-2xl font-bold ${
                        listingGain >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {formatPercent(listingGain)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                label="Lot Size"
                value={lotSize ? lotSize.toLocaleString("en-IN") : "-"}
                tooltip="Number of shares in one lot"
                icon={Target}
              />
              <MetricCard
                label="Issue Open"
                value={
                  issueOpen
                    ? new Date(issueOpen).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "-"
                }
                tooltip="IPO subscription start date"
                icon={Calendar}
              />
              <MetricCard
                label="Issue Close"
                value={
                  issueClose
                    ? new Date(issueClose).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "-"
                }
                tooltip="IPO subscription end date"
                icon={Calendar}
              />
              {listingDate && (
                <MetricCard
                  label="Listing Date"
                  value={new Date(listingDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                  tooltip="Stock exchange listing date"
                  icon={Calendar}
                />
              )}
              {subscription && (
                <MetricCard
                  label="Subscription"
                  value={`${formatNumber(subscription, 1)}x`}
                  tooltip="Total subscription times"
                  icon={Activity}
                  highlight
                />
              )}
              {gmp && (
                <MetricCard
                  label="GMP"
                  value={`₹${formatNumber(gmp)}`}
                  tooltip="Grey Market Premium - unofficial premium over issue price"
                  icon={TrendingUp}
                  trend={gmp >= 0 ? "up" : "down"}
                />
              )}
            </div>

            {/* Subscription Details */}
            {(qib || nii || retail) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Subscription Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <MetricCard
                      label="QIB"
                      value={qib ? `${formatNumber(qib, 1)}x` : "-"}
                      tooltip="Qualified Institutional Buyers subscription"
                      icon={Building2}
                    />
                    <MetricCard
                      label="NII"
                      value={nii ? `${formatNumber(nii, 1)}x` : "-"}
                      tooltip="Non-Institutional Investors subscription"
                      icon={Wallet}
                    />
                    <MetricCard
                      label="Retail"
                      value={retail ? `${formatNumber(retail, 1)}x` : "-"}
                      tooltip="Retail investors subscription"
                      icon={Users}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Additional Details */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="dates">Important Dates</TabsTrigger>
                <TabsTrigger value="financials">Financials</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Company Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Company Name</p>
                        <p className="font-medium">{name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Sector</p>
                        <p className="font-medium">{sector || "-"}</p>
                      </div>
                      {industry && (
                        <div>
                          <p className="text-sm text-muted-foreground">Industry</p>
                          <p className="font-medium">{industry}</p>
                        </div>
                      )}
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
              <TabsContent value="dates" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Important Dates</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <MetricCard
                        label="Issue Open Date"
                        value={
                          issueOpen
                            ? new Date(issueOpen).toLocaleDateString("en-IN", {
                                weekday: "long",
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })
                            : "-"
                        }
                        tooltip="IPO subscription start date"
                        icon={Calendar}
                      />
                      <MetricCard
                        label="Issue Close Date"
                        value={
                          issueClose
                            ? new Date(issueClose).toLocaleDateString("en-IN", {
                                weekday: "long",
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })
                            : "-"
                        }
                        tooltip="IPO subscription end date"
                        icon={Calendar}
                      />
                      {listingDate && (
                        <MetricCard
                          label="Listing Date"
                          value={new Date(listingDate).toLocaleDateString("en-IN", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                          tooltip="Stock exchange listing date"
                          icon={Calendar}
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="financials" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Financial Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <MetricCard
                        label="Price Band"
                        value={
                          priceLow && priceHigh
                            ? `₹${formatNumber(priceLow)} - ₹${formatNumber(priceHigh)}`
                            : "-"
                        }
                        tooltip="IPO price range per share"
                        icon={Wallet}
                        highlight
                      />
                      <MetricCard
                        label="Issue Size"
                        value={formatCurrency(issueSize)}
                        tooltip="Total issue size in crores"
                        icon={BarChart3}
                      />
                      <MetricCard
                        label="Lot Size"
                        value={lotSize ? lotSize.toLocaleString("en-IN") : "-"}
                        tooltip="Number of shares in one lot"
                        icon={Target}
                      />
                      {gmp && (
                        <MetricCard
                          label="GMP"
                          value={`₹${formatNumber(gmp)}`}
                          tooltip="Grey Market Premium"
                          icon={TrendingUp}
                          trend={gmp >= 0 ? "up" : "down"}
                        />
                      )}
                      {listingGain !== null && listingGain !== undefined && (
                        <MetricCard
                          label="Listing Gain"
                          value={formatPercent(listingGain)}
                          tooltip="Percentage gain on listing day"
                          icon={Percent}
                          trend={listingGain >= 0 ? "up" : "down"}
                        />
                      )}
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
