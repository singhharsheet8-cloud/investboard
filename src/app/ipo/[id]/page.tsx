"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useIPO } from "@/lib/swr-fetchers";
import { useParams } from "next/navigation";

export default function IPODetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { data, error, isLoading } = useIPO(id);

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
                Error loading IPO data: {error.message}
              </p>
            </CardContent>
          </Card>
        )}
        {data && (
          <>
            <div>
              <h1 className="text-3xl font-bold">
                {data.identifier?.name || id}
              </h1>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>IPO Details</CardTitle>
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
