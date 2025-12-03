"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshButton } from "@/components/common/RefreshButton";
import { LastUpdatedText } from "@/components/common/LastUpdatedText";
import { ErrorState } from "@/components/common/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { useMarketSnapshot } from "@/lib/swr-fetchers";
import { useState } from "react";
import { mutate } from "swr";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function MarketSnapshotCard() {
  const [refreshKey, setRefreshKey] = useState(0);
  const { data, error, isLoading, mutate: refetch } = useMarketSnapshot(
    refreshKey > 0
  );

  const handleRefresh = async () => {
    setRefreshKey((k) => k + 1);
    await mutate("/api/market/snapshot?refresh=true");
    await refetch();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Market Snapshot</CardTitle>
        <RefreshButton onRefresh={handleRefresh} />
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        )}
        {error && (
          <ErrorState message={error.message} onRetry={handleRefresh} />
        )}
        {data && (
          <div className="space-y-4">
            {data.metrics?.market_snapshot?.indices?.map(
              (index: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-semibold">{index.name}</p>
                    <p className="text-2xl font-bold">{index.value.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-semibold ${
                        index.change >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {index.change >= 0 ? "+" : ""}
                      {index.change.toFixed(2)} (
                      {index.changePercent >= 0 ? "+" : ""}
                      {index.changePercent.toFixed(2)}%)
                    </p>
                  </div>
                </div>
              )
            )}
            {data.metrics?.market_snapshot?.marketBreadth && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">
                  Market Breadth
                </p>
                <div className="flex gap-4">
                  <div>
                    <span className="text-green-600 font-semibold">
                      {data.metrics.market_snapshot.marketBreadth.advances}
                    </span>{" "}
                    Advances
                  </div>
                  <div>
                    <span className="text-red-600 font-semibold">
                      {data.metrics.market_snapshot.marketBreadth.declines}
                    </span>{" "}
                    Declines
                  </div>
                  <div>
                    <span className="text-muted-foreground font-semibold">
                      {data.metrics.market_snapshot.marketBreadth.unchanged}
                    </span>{" "}
                    Unchanged
                  </div>
                </div>
              </div>
            )}
            {data.timestamp && (
              <LastUpdatedText timestamp={data.timestamp} className="mt-4" />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

