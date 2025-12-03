"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshButton } from "@/components/common/RefreshButton";
import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCurrentIPOs,
  useUpcomingIPOs,
  usePastIPOs,
} from "@/lib/swr-fetchers";
import { mutate } from "swr";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore, useHasHydrated } from "@/lib/store";

export default function IPOPage() {
  const [currentRefresh, setCurrentRefresh] = useState(0);
  const [upcomingRefresh, setUpcomingRefresh] = useState(0);
  const [pastRefresh, setPastRefresh] = useState(0);
  const hasHydrated = useHasHydrated();
  const getOrCreateUserId = useAppStore((state) => state.getOrCreateUserId);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (hasHydrated) {
      setUserId(getOrCreateUserId());
    }
  }, [hasHydrated, getOrCreateUserId]);

  const { data: currentIPOs, isLoading: currentLoading, mutate: currentMutate } =
    useCurrentIPOs(currentRefresh > 0);
  const { data: upcomingIPOs, isLoading: upcomingLoading, mutate: upcomingMutate } =
    useUpcomingIPOs(upcomingRefresh > 0);
  const { data: pastIPOs, isLoading: pastLoading, mutate: pastMutate } =
    usePastIPOs(pastRefresh > 0);

  const handleRefreshCurrent = async () => {
    setCurrentRefresh((k) => k + 1);
    await mutate("/api/ipo/current?refresh=true");
    await currentMutate();
  };

  const handleRefreshUpcoming = async () => {
    setUpcomingRefresh((k) => k + 1);
    await mutate("/api/ipo/upcoming?refresh=true");
    await upcomingMutate();
  };

  const handleRefreshPast = async () => {
    setPastRefresh((k) => k + 1);
    await mutate("/api/ipo/past?refresh=true");
    await pastMutate();
  };

  const handleAddToWatchlist = async (id: string) => {
    if (!userId) return;
    try {
      await fetch("/api/watchlist/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          entityType: "ipo",
          entityKey: id,
        }),
      });
      alert("Added to watchlist!");
    } catch (error) {
      console.error("Failed to add to watchlist:", error);
      alert("Failed to add to watchlist");
    }
  };

  const renderIPOTable = (ipos: unknown[], isLoading: boolean) => {
    if (isLoading) {
      return (
        <div className="space-y-2">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
      );
    }

    if (!ipos || ipos.length === 0) {
      return <EmptyState title="No IPOs found" description="No IPOs available in this category" />;
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Company</TableHead>
            <TableHead>Sector</TableHead>
            <TableHead>Price Band</TableHead>
            <TableHead>Issue Dates</TableHead>
            <TableHead>GMP</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(ipos as any[]).map((ipo, index: number) => {
            const ipoData = ipo.metrics?.ipo || ipo;
            const id = ipo.identifier?.code || ipo.identifier?.symbol || String(index);
            return (
              <TableRow key={id}>
                <TableCell>
                  <Link
                    href={`/ipo/${id}`}
                    className="font-semibold hover:underline text-primary"
                  >
                    {ipoData.companyName || ipo.identifier?.name || "Unknown"}
                  </Link>
                </TableCell>
                <TableCell className="capitalize">{ipoData.sector || "N/A"}</TableCell>
                <TableCell>
                  {ipoData.priceBandHigh
                    ? `₹${ipoData.priceBandLow || "N/A"} - ₹${ipoData.priceBandHigh}`
                    : "N/A"}
                </TableCell>
                <TableCell>
                  {ipoData.issueOpen && ipoData.issueClose
                    ? `${new Date(ipoData.issueOpen).toLocaleDateString()} - ${new Date(ipoData.issueClose).toLocaleDateString()}`
                    : "N/A"}
                </TableCell>
                <TableCell>
                  {ipoData.gmp !== null && ipoData.gmp !== undefined ? (
                    <span className="text-green-600 font-semibold">₹{ipoData.gmp}</span>
                  ) : (
                    "N/A"
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddToWatchlist(id)}
                    disabled={!userId}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add to Watchlist
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">IPOs</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>IPO Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="current" className="w-full">
              <TabsList>
                <TabsTrigger value="current">Current</TabsTrigger>
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="past">Past</TabsTrigger>
              </TabsList>
              <TabsContent value="current" className="space-y-4">
                <div className="flex justify-end">
                  <RefreshButton onRefresh={handleRefreshCurrent} />
                </div>
                {renderIPOTable(
                  Array.isArray(currentIPOs) ? currentIPOs : [],
                  currentLoading
                )}
              </TabsContent>
              <TabsContent value="upcoming" className="space-y-4">
                <div className="flex justify-end">
                  <RefreshButton onRefresh={handleRefreshUpcoming} />
                </div>
                {renderIPOTable(
                  Array.isArray(upcomingIPOs) ? upcomingIPOs : [],
                  upcomingLoading
                )}
              </TabsContent>
              <TabsContent value="past" className="space-y-4">
                <div className="flex justify-end">
                  <RefreshButton onRefresh={handleRefreshPast} />
                </div>
                {renderIPOTable(Array.isArray(pastIPOs) ? pastIPOs : [], pastLoading)}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
