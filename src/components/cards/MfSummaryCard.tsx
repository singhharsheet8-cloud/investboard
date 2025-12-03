"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface MfSummaryCardProps {
  fund: {
    identifier?: {
      name?: string;
      code?: string;
    };
    metrics?: {
      mutual_fund?: {
        categoryName?: string | null;
        aumCr?: number | null;
        returns?: {
          y3?: number | null;
        };
        risk?: {
          sharpe3Y?: number | null;
        };
        expenseRatioPercent?: number | null;
      };
    };
  };
}

export function MfSummaryCard({ fund }: MfSummaryCardProps) {
  const mf = fund.metrics?.mutual_fund;

  return (
    <Link href={`/mutual-funds/${fund.identifier?.code || ""}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader>
          <CardTitle className="text-lg">{fund.identifier?.name || "Unknown Fund"}</CardTitle>
          {mf?.categoryName && (
            <Badge variant="secondary" className="mt-2 w-fit">
              {mf.categoryName}
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {mf?.aumCr != null && (
              <div>
                <p className="text-muted-foreground">AUM</p>
                <p className="font-semibold">₹{mf.aumCr.toFixed(2)} Cr</p>
              </div>
            )}
            {mf?.returns?.y3 != null && (
              <div>
                <p className="text-muted-foreground">3Y Return</p>
                <p
                  className={`font-semibold ${
                    mf.returns.y3 >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {mf.returns.y3 >= 0 ? "+" : ""}
                  {mf.returns.y3.toFixed(2)}%
                </p>
              </div>
            )}
            {mf?.risk?.sharpe3Y != null && (
              <div>
                <p className="text-muted-foreground">Sharpe (3Y)</p>
                <p className="font-semibold">{mf.risk.sharpe3Y.toFixed(2)}</p>
              </div>
            )}
            {mf?.expenseRatioPercent != null && (
              <div>
                <p className="text-muted-foreground">Expense Ratio</p>
                <p className="font-semibold">
                  {mf.expenseRatioPercent.toFixed(2)}%
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
