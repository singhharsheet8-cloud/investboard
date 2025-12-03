"use client";

import { AppShell } from "@/components/layout/AppShell";
import { MarketSnapshotCard } from "@/components/cards/MarketSnapshotCard";
import { WatchlistTable } from "@/components/watchlist/WatchlistTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrentIPOs } from "@/lib/swr-fetchers";
import { IpoSummaryCard } from "@/components/cards/IpoSummaryCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomePage() {
  const { data: currentIPOs, isLoading: iposLoading } = useCurrentIPOs();

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
        </div>

        {/* Market Snapshot */}
        <MarketSnapshotCard />

        {/* Watchlist Section */}
        <Card>
          <CardHeader>
            <CardTitle>Watchlist</CardTitle>
          </CardHeader>
          <CardContent>
            <WatchlistTable />
          </CardContent>
        </Card>

        {/* IPO Highlights */}
        <Card>
          <CardHeader>
            <CardTitle>IPO Highlights</CardTitle>
          </CardHeader>
          <CardContent>
            {iposLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Skeleton className="h-48" />
                <Skeleton className="h-48" />
                <Skeleton className="h-48" />
              </div>
            )}
            {currentIPOs && Array.isArray(currentIPOs) && currentIPOs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentIPOs.slice(0, 3).map((ipo: any, index: number) => (
                  <IpoSummaryCard
                    key={index}
                    ipo={ipo}
                    id={ipo.identifier?.code || ipo.identifier?.symbol || String(index)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">
                No current IPOs available. Check back later or refresh to fetch latest data.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
