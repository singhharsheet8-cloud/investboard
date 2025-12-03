"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshButton } from "@/components/common/RefreshButton";
import { LastUpdatedText } from "@/components/common/LastUpdatedText";
import { ErrorState } from "@/components/common/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { useMarketSnapshot } from "@/lib/swr-fetchers";
import { useState } from "react";
import { mutate } from "swr";
import { TrendingUp, TrendingDown } from "lucide-react";

interface IndexData {
  value: number;
  change: number;
  changePercent: number;
}

interface MarketData {
  nifty50?: IndexData;
  sensex?: IndexData;
  niftyBank?: IndexData;
  breadth?: {
    advances: number | null;
    declines: number | null;
    unchanged: number | null;
  };
  timestamp?: string;
  marketStatus?: string;
  // Legacy format support
  metrics?: {
    market_snapshot?: {
      indices?: Array<{
        name: string;
        value: number;
        change: number;
        changePercent: number;
      }>;
      marketBreadth?: {
        advances: number;
        declines: number;
        unchanged: number;
      };
    };
  };
}

function IndexCard({ name, data }: { name: string; data: IndexData }) {
  const isPositive = data.change >= 0;
  
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
      <div>
        <p className="font-medium text-muted-foreground">{name}</p>
        <p className="text-2xl font-bold">{data.value?.toLocaleString('en-IN')}</p>
      </div>
      <div className="text-right flex items-center gap-2">
        {isPositive ? (
          <TrendingUp className="h-5 w-5 text-green-600" />
        ) : (
          <TrendingDown className="h-5 w-5 text-red-600" />
        )}
        <div>
          <p className={`font-semibold ${isPositive ? "text-green-600" : "text-red-600"}`}>
            {isPositive ? "+" : ""}{data.change?.toFixed(2)}
          </p>
          <p className={`text-sm ${isPositive ? "text-green-600" : "text-red-600"}`}>
            ({isPositive ? "+" : ""}{data.changePercent?.toFixed(2)}%)
          </p>
        </div>
      </div>
    </div>
  );
}

export function MarketSnapshotCard() {
  const [refreshKey, setRefreshKey] = useState(0);
  const { data, error, isLoading, mutate: refetch } = useMarketSnapshot(refreshKey > 0);

  const handleRefresh = async () => {
    setRefreshKey((k) => k + 1);
    await mutate("/api/market/snapshot?refresh=true");
    await refetch();
  };

  // Convert data to display format
  const getIndices = (data: MarketData) => {
    // Check for new flat format first
    if (data.nifty50 || data.sensex || data.niftyBank) {
      const indices = [];
      if (data.nifty50) indices.push({ name: "Nifty 50", ...data.nifty50 });
      if (data.sensex) indices.push({ name: "Sensex", ...data.sensex });
      if (data.niftyBank) indices.push({ name: "Nifty Bank", ...data.niftyBank });
      return indices;
    }
    // Legacy format
    return data.metrics?.market_snapshot?.indices || [];
  };

  const getBreadth = (data: MarketData) => {
    if (data.breadth) return data.breadth;
    return data.metrics?.market_snapshot?.marketBreadth || null;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle>Market Snapshot</CardTitle>
          {data?.marketStatus && (
            <span className={`text-xs px-2 py-1 rounded-full ${
              data.marketStatus === 'open' 
                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
            }`}>
              {data.marketStatus === 'open' ? '● Live' : '○ Closed'}
            </span>
          )}
        </div>
        <RefreshButton onRefresh={handleRefresh} />
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        )}
        {error && (
          <ErrorState message={error.message} onRetry={handleRefresh} />
        )}
        {data && !isLoading && (
          <div className="space-y-4">
            {/* Index Cards */}
            <div className="grid gap-3">
              {getIndices(data).map((index: any, i: number) => (
                <IndexCard key={i} name={index.name} data={index} />
              ))}
            </div>
            
            {/* Market Breadth */}
            {getBreadth(data) && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Market Breadth</p>
                <div className="flex gap-6">
                  <div className="flex items-center gap-1">
                    <span className="text-green-600 font-semibold">
                      {getBreadth(data)?.advances ?? '-'}
                    </span>
                    <span className="text-sm text-muted-foreground">Advances</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-red-600 font-semibold">
                      {getBreadth(data)?.declines ?? '-'}
                    </span>
                    <span className="text-sm text-muted-foreground">Declines</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground font-semibold">
                      {getBreadth(data)?.unchanged ?? '-'}
                    </span>
                    <span className="text-sm text-muted-foreground">Unchanged</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Timestamp */}
            {data.timestamp && (
              <LastUpdatedText timestamp={data.timestamp} className="mt-4" />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
