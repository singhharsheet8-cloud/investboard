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
import { Plus, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Company</TableHead>
              <TableHead className="font-semibold">Sector</TableHead>
              <TableHead className="font-semibold">Price Band</TableHead>
              <TableHead className="font-semibold">Issue Dates</TableHead>
              <TableHead className="font-semibold">GMP</TableHead>
              <TableHead className="font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(ipos as any[]).map((ipo, index: number) => {
              const ipoData = ipo.metrics?.ipo || ipo;
              const id = ipo.identifier?.code || ipo.identifier?.symbol || String(index);
              return (
                <TableRow
                  key={id}
                  className="hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  <TableCell>
                    <Link
                      href={`/ipo/${id}`}
                      className="font-semibold hover:underline text-primary"
                    >
                      {ipoData.companyName || ipoData.name || ipo.identifier?.name || "Unknown"}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {ipoData.sector || "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {ipoData.priceBandHigh || ipoData.priceHigh
                      ? `₹${ipoData.priceBandLow || ipoData.priceLow || "N/A"} - ₹${ipoData.priceBandHigh || ipoData.priceHigh}`
                      : "N/A"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {ipoData.issueOpen && ipoData.issueClose
                      ? `${new Date(ipoData.issueOpen).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })} - ${new Date(ipoData.issueClose).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}`
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    {ipoData.gmp !== null && ipoData.gmp !== undefined ? (
                      <span
                        className={`font-semibold ${
                          ipoData.gmp >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        ₹{ipoData.gmp}
                      </span>
                    ) : (
                      "N/A"
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToWatchlist(id);
                      }}
                      disabled={!userId}
                      className="hover:bg-primary hover:text-primary-foreground"
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
      </div>
    );
  };

  return (
    <AppShell>
      <div className="space-y-6 pb-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold">IPOs</h1>
          <p className="text-muted-foreground">
            Track current, upcoming, and past Initial Public Offerings in India.
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              IPO Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="current" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="current" className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-600"></span>
                  Current
                </TabsTrigger>
                <TabsTrigger value="upcoming" className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  Upcoming
                </TabsTrigger>
                <TabsTrigger value="past" className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gray-600"></span>
                  Past
                </TabsTrigger>
              </TabsList>
              <TabsContent value="current" className="space-y-4 mt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Currently Open IPOs</h3>
                    <p className="text-sm text-muted-foreground">
                      IPOs that are currently accepting subscriptions
                    </p>
                  </div>
                  <RefreshButton onRefresh={handleRefreshCurrent} />
                </div>
                {renderIPOTable(
                  Array.isArray(currentIPOs) ? currentIPOs : [],
                  currentLoading
                )}
              </TabsContent>
              <TabsContent value="upcoming" className="space-y-4 mt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Upcoming IPOs</h3>
                    <p className="text-sm text-muted-foreground">
                      IPOs scheduled to open in the near future
                    </p>
                  </div>
                  <RefreshButton onRefresh={handleRefreshUpcoming} />
                </div>
                {renderIPOTable(
                  Array.isArray(upcomingIPOs) ? upcomingIPOs : [],
                  upcomingLoading
                )}
              </TabsContent>
              <TabsContent value="past" className="space-y-4 mt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Past IPOs</h3>
                    <p className="text-sm text-muted-foreground">
                      Recently listed IPOs and their performance
                    </p>
                  </div>
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
