"use client";

import { AppShell } from "@/components/layout/AppShell";
import { MarketSnapshotCard } from "@/components/cards/MarketSnapshotCard";
import { WatchlistTable } from "@/components/watchlist/WatchlistTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrentIPOs, useUpcomingIPOs } from "@/lib/swr-fetchers";
import { IpoSummaryCard } from "@/components/cards/IpoSummaryCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Sparkles,
  BarChart3,
  PieChart,
  Building2,
  Briefcase,
} from "lucide-react";

export default function HomePage() {
  const { data: currentIPOs, isLoading: iposLoading } = useCurrentIPOs();
  const { data: upcomingIPOs, isLoading: upcomingLoading } = useUpcomingIPOs();

  return (
    <AppShell>
      <div className="space-y-8 pb-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-background border border-primary/20 p-8 md:p-12">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-6 w-6 text-primary animate-pulse" />
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Investment Dashboard
              </h1>
            </div>
            <p className="text-lg text-muted-foreground mb-6 max-w-2xl">
              Track stocks, mutual funds, and IPOs in real-time. Make informed investment decisions with comprehensive market data.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="shadow-lg">
                <Link href="/stocks">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Explore Stocks
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="shadow-lg">
                <Link href="/mutual-funds">
                  <PieChart className="h-5 w-5 mr-2" />
                  Browse Mutual Funds
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="shadow-lg">
                <Link href="/ipo">
                  <Briefcase className="h-5 w-5 mr-2" />
                  View IPOs
                </Link>
              </Button>
            </div>
          </div>
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-0" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -z-0" />
        </div>

        {/* Market Snapshot - Enhanced */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Market Overview</h2>
                <p className="text-sm text-muted-foreground">Real-time market indices and breadth</p>
              </div>
            </div>
          </div>
          <MarketSnapshotCard />
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="hover:shadow-lg transition-all border-primary/20 bg-gradient-to-br from-green-50 to-green-50/50 dark:from-green-950/20 dark:to-green-950/10">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Quick Access</p>
                  <p className="text-2xl font-bold">Stocks</p>
                </div>
                <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                  <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <Button asChild variant="ghost" className="mt-4 w-full" size="sm">
                <Link href="/stocks">
                  View All Stocks <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all border-primary/20 bg-gradient-to-br from-blue-50 to-blue-50/50 dark:from-blue-950/20 dark:to-blue-950/10">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Quick Access</p>
                  <p className="text-2xl font-bold">Mutual Funds</p>
                </div>
                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <PieChart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <Button asChild variant="ghost" className="mt-4 w-full" size="sm">
                <Link href="/mutual-funds">
                  Browse Funds <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all border-primary/20 bg-gradient-to-br from-purple-50 to-purple-50/50 dark:from-purple-950/20 dark:to-purple-950/10">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Quick Access</p>
                  <p className="text-2xl font-bold">IPOs</p>
                </div>
                <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30">
                  <Briefcase className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <Button asChild variant="ghost" className="mt-4 w-full" size="sm">
                <Link href="/ipo">
                  View IPOs <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Watchlist Section - Enhanced */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">My Watchlist</h2>
                <p className="text-sm text-muted-foreground">Track your favorite investments</p>
              </div>
            </div>
          </div>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Watchlist</CardTitle>
            </CardHeader>
            <CardContent>
              <WatchlistTable />
            </CardContent>
          </Card>
        </div>

        {/* IPO Highlights - Enhanced */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Briefcase className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">IPO Highlights</h2>
                <p className="text-sm text-muted-foreground">Currently open and upcoming IPOs</p>
              </div>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/ipo">
                View All <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>

          {/* Current IPOs */}
          {currentIPOs && Array.isArray(currentIPOs) && currentIPOs.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge className="bg-green-600 text-white">Open Now</Badge>
                <h3 className="text-lg font-semibold">Currently Open IPOs</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentIPOs.slice(0, 3).map((ipo: any, index: number) => (
                  <IpoSummaryCard
                    key={index}
                    ipo={ipo}
                    id={ipo.name || ipo.identifier?.code || ipo.identifier?.name || String(index)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Upcoming IPOs */}
          {upcomingIPOs && Array.isArray(upcomingIPOs) && upcomingIPOs.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-600 text-white">Upcoming</Badge>
                <h3 className="text-lg font-semibold">Upcoming IPOs</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingIPOs.slice(0, 3).map((ipo: any, index: number) => (
                  <IpoSummaryCard
                    key={index}
                    ipo={ipo}
                    id={ipo.name || ipo.identifier?.code || ipo.identifier?.name || String(index)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Loading State */}
          {(iposLoading || upcomingLoading) && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-48 rounded-lg" />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!iposLoading &&
            !upcomingLoading &&
            (!currentIPOs || (Array.isArray(currentIPOs) && currentIPOs.length === 0)) &&
            (!upcomingIPOs || (Array.isArray(upcomingIPOs) && upcomingIPOs.length === 0)) && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    No IPOs available at the moment. Check back later or refresh to fetch latest data.
                  </p>
                  <Button asChild variant="outline">
                    <Link href="/ipo">Browse All IPOs</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
        </div>

        {/* Footer Note */}
        <Card className="border-dashed bg-muted/30">
          <CardContent className="py-6 text-center">
            <p className="text-sm text-muted-foreground">
              <strong>Disclaimer:</strong> This is not investment advice. Data is fetched via public sources and may be inaccurate or delayed. Please verify before investing.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
