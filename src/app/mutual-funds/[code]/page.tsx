"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutualFund } from "@/lib/swr-fetchers";
import { useParams } from "next/navigation";

export default function MutualFundDetailPage() {
  const params = useParams();
  const code = params?.code as string;
  const { data, error, isLoading } = useMutualFund(code);

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
                Error loading mutual fund data: {error.message}
              </p>
            </CardContent>
          </Card>
        )}
        {data && (
          <>
            <div>
              <h1 className="text-3xl font-bold">
                {data.identifier?.name || code}
              </h1>
              <p className="text-muted-foreground">
                {data.identifier?.code || code}
              </p>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Mutual Fund Details</CardTitle>
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
