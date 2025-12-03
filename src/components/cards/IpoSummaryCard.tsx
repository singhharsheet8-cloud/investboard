"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface IpoSummaryCardProps {
  ipo: {
    identifier?: {
      name?: string;
    };
    metrics?: {
      ipo?: {
        companyName?: string;
        sector?: string | null;
        issueOpen?: string | null;
        issueClose?: string | null;
        priceBandHigh?: number | null;
        gmp?: number | null;
      };
    };
  };
  id: string;
}

export function IpoSummaryCard({ ipo, id }: IpoSummaryCardProps) {
  const ipoData = ipo.metrics?.ipo;

  return (
    <Link href={`/ipo/${id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader>
          <CardTitle className="text-lg">
            {ipoData?.companyName || ipo.identifier?.name || "Unknown IPO"}
          </CardTitle>
          {ipoData?.sector && (
            <Badge variant="secondary" className="mt-2 w-fit">
              {ipoData.sector}
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {ipoData?.issueOpen && ipoData?.issueClose && (
              <div>
                <p className="text-muted-foreground">Issue Dates</p>
                <p className="font-semibold">
                  {new Date(ipoData.issueOpen).toLocaleDateString()} -{" "}
                  {new Date(ipoData.issueClose).toLocaleDateString()}
                </p>
              </div>
            )}
            {ipoData?.priceBandHigh != null && (
              <div>
                <p className="text-muted-foreground">Price Band</p>
                <p className="font-semibold">₹{ipoData.priceBandHigh}</p>
              </div>
            )}
            {ipoData?.gmp != null && (
              <div>
                <p className="text-muted-foreground">GMP</p>
                <p className="font-semibold text-green-600">
                  ₹{ipoData.gmp.toFixed(2)}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
