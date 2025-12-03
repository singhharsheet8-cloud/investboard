"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useStock } from "@/lib/swr-fetchers";
import { useParams } from "next/navigation";

export default function StockDetailPage() {
  const params = useParams();
  const symbol = params?.symbol as string;
  const { data, error, isLoading } = useStock(symbol);

  return (
    <AppShell>
      <div className="space-y-6">
        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-64 w-full" />
          </div>
        )}
        {error && (
          <Card>
            <CardContent className="py-12">
              <p className="text-center text-muted-foreground">
                Error loading stock data: {error.message}
              </p>
            </CardContent>
          </Card>
        )}
        {data && (
          <>
            <div>
              <h1 className="text-3xl font-bold">
                {data.identifier?.name || symbol}
              </h1>
              <p className="text-muted-foreground">
                {data.identifier?.symbol || symbol}
              </p>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Stock Details</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}
