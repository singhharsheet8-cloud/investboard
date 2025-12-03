"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Calendar, TrendingUp, IndianRupee } from "lucide-react";

interface IpoData {
  // New flat format
  name?: string;
  sector?: string | null;
  issueOpen?: string | null;
  issueClose?: string | null;
  priceLow?: number | null;
  priceHigh?: number | null;
  lotSize?: number | null;
  gmp?: number | null;
  issueSize?: number | null;
  subscription?: number | null;
  // Legacy nested format
  identifier?: {
    name?: string;
    code?: string;
  };
  metrics?: {
    ipo?: {
      companyName?: string;
      sector?: string | null;
      issueOpen?: string | null;
      issueClose?: string | null;
      priceBandHigh?: number | null;
      priceBandLow?: number | null;
      gmp?: number | null;
      lotSize?: number | null;
    };
  };
}

interface IpoSummaryCardProps {
  ipo: IpoData;
  id: string;
}

export function IpoSummaryCard({ ipo, id }: IpoSummaryCardProps) {
  // Support both flat and nested formats
  const name = ipo.name || ipo.metrics?.ipo?.companyName || ipo.identifier?.name || "Unknown IPO";
  const sector = ipo.sector || ipo.metrics?.ipo?.sector;
  const issueOpen = ipo.issueOpen || ipo.metrics?.ipo?.issueOpen;
  const issueClose = ipo.issueClose || ipo.metrics?.ipo?.issueClose;
  const priceHigh = ipo.priceHigh || ipo.metrics?.ipo?.priceBandHigh;
  const priceLow = ipo.priceLow || ipo.metrics?.ipo?.priceBandLow;
  const gmp = ipo.gmp || ipo.metrics?.ipo?.gmp;
  const lotSize = ipo.lotSize || ipo.metrics?.ipo?.lotSize;
  const subscription = ipo.subscription;

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', { 
        day: 'numeric', 
        month: 'short' 
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Link href={`/ipo/${encodeURIComponent(id || name)}`}>
      <Card className="hover:shadow-lg transition-all cursor-pointer h-full hover:border-primary/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg line-clamp-2">{name}</CardTitle>
          {sector && (
            <Badge variant="secondary" className="mt-2 w-fit">
              {sector}
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            {/* Price Band */}
            {(priceHigh != null || priceLow != null) && (
              <div className="flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground text-xs">Price Band</p>
                  <p className="font-semibold">
                    ₹{priceLow ?? '-'} - ₹{priceHigh ?? '-'}
                  </p>
                </div>
              </div>
            )}

            {/* Issue Dates */}
            {issueOpen && issueClose && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground text-xs">Issue Period</p>
                  <p className="font-semibold">
                    {formatDate(issueOpen)} - {formatDate(issueClose)}
                  </p>
                </div>
              </div>
            )}

            {/* Subscription & GMP */}
            <div className="flex gap-4 pt-2 border-t">
              {subscription != null && (
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="font-semibold text-green-600">
                    {subscription.toFixed(2)}x
                  </span>
                  <span className="text-xs text-muted-foreground">subscribed</span>
                </div>
              )}
              {gmp != null && (
                <div>
                  <span className="text-xs text-muted-foreground">GMP: </span>
                  <span className={`font-semibold ${gmp >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{gmp}
                  </span>
                </div>
              )}
            </div>

            {/* Lot Size */}
            {lotSize != null && (
              <div className="text-xs text-muted-foreground">
                Lot Size: {lotSize} shares
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
