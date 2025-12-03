"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Settings2 } from "lucide-react";
import { useWatchlistItems, useWatchlistPreferences, useStock, useMutualFund, useIPO } from "@/lib/swr-fetchers";
import { useAppStore, useHasHydrated } from "@/lib/store";
import { SkeletonTable } from "@/components/common/SkeletonTable";
import { EmptyState } from "@/components/common/EmptyState";
import { WatchlistColumnSelector } from "./WatchlistColumnSelector";
import Link from "next/link";
import { getMetricsForEntityType, MetricKey } from "@/lib/watchlist-metrics";

interface WatchlistItemType {
  id: string;
  entityType: string;
  entityKey: string;
}

// Helper to extract metric value from data - handles both nested and flat structures
function getMetricValue(data: any, metricKey: MetricKey): string | number | null {
  if (!data) return null;
  
  const parts = metricKey.split(".");
  
  // Handle nested structure (e.g., "mf.returns.y3" or "stock.price")
  let value: any = data;
  for (const part of parts) {
    if (value === null || value === undefined) return null;
    value = value[part];
    if (value === null || value === undefined) break;
  }
  
  // If found in nested structure, return it
  if (value !== null && value !== undefined) {
    return value;
  }
  
  // If not found in nested, try direct flat access
  // For "mf.returns.y3" -> try "returns.y3", "returns_y3", "y3"
  if (parts.length > 1) {
    const lastPart = parts[parts.length - 1];
    const parentPart = parts[parts.length - 2];
    
    // Try parent.lastPart (e.g., returns.y3 or returns["3y"])
    if (data[parentPart] && typeof data[parentPart] === "object") {
      value = data[parentPart][lastPart] || data[parentPart][`${lastPart}`] || data[parentPart][lastPart.replace("y", "")];
      if (value !== null && value !== undefined) return value;
    }
    
    // Try snake_case (e.g., returns_y3)
    const snakeKey = `${parentPart}_${lastPart}`;
    value = data[snakeKey];
    if (value !== null && value !== undefined) return value;
  }
  
  // Try flat structure with snake_case
  const flatKey = metricKey.replace(/\./g, "_");
  value = data[flatKey];
  if (value !== null && value !== undefined) return value;
  
  // Try camelCase version
  const camelKey = metricKey.split(".").map((p, i) => 
    i === 0 ? p : p.charAt(0).toUpperCase() + p.slice(1)
  ).join("");
  value = data[camelKey];
  
  return value;
}

// Format metric value for display
function formatMetricValue(value: any, metricKey: MetricKey): string {
  if (value === null || value === undefined) return "-";
  
  if (metricKey.includes("Percent") || metricKey.includes("percent") || metricKey.includes("y3") || metricKey.includes("y5") || metricKey.includes("y10")) {
    return typeof value === "number" ? `${value.toFixed(2)}%` : String(value);
  }
  
  if (metricKey.includes("Cr") || metricKey === "stock.marketCap") {
    return typeof value === "number" ? `₹${(value / 1000).toFixed(1)}K Cr` : String(value);
  }
  
  if (metricKey === "stock.price") {
    return typeof value === "number" ? `₹${value.toFixed(2)}` : String(value);
  }
  
  if (metricKey.includes("date") || metricKey.includes("Date") || metricKey.includes("Open") || metricKey.includes("Close")) {
    try {
      return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    } catch {
      return String(value);
    }
  }
  
  return typeof value === "number" ? value.toLocaleString("en-IN") : String(value);
}

// Component to render a watchlist item with metrics
function WatchlistItemRow({ 
  item, 
  preferences, 
  onRemove 
}: { 
  item: WatchlistItemType; 
  preferences: MetricKey[] | null;
  onRemove: () => void;
}) {
  const { data: stockData } = useStock(item.entityType === "stock" ? item.entityKey : null);
  const { data: mfData } = useMutualFund(item.entityType === "mutual_fund" ? item.entityKey : null);
  const { data: ipoData } = useIPO(item.entityType === "ipo" ? item.entityKey : null);
  
  const entityData = item.entityType === "stock" ? stockData : 
                     item.entityType === "mutual_fund" ? mfData : 
                     ipoData;
  
  const metrics = preferences || [];
  const availableMetrics = getMetricsForEntityType(item.entityType as any);
  
  // Get name from data - handle both flat and nested structures
  let name = item.entityKey;
  if (entityData) {
    if (item.entityType === "stock") {
      name = entityData?.name || entityData?.metrics?.stock?.entity_name || entityData?.identifier?.name || item.entityKey;
    } else if (item.entityType === "mutual_fund") {
      name = entityData?.name || entityData?.metrics?.mutual_fund?.entity_name || entityData?.identifier?.name || item.entityKey;
    } else if (item.entityType === "ipo") {
      name = entityData?.name || entityData?.companyName || entityData?.metrics?.ipo?.company_name || entityData?.identifier?.name || item.entityKey;
    }
  }

  return (
    <TableRow className="hover:bg-muted/30">
      <TableCell>
        <Link
          href={`/${item.entityType === "mutual_fund" ? "mutual-funds" : item.entityType}s/${item.entityKey}`}
          className="font-semibold hover:underline text-primary"
        >
          {name}
        </Link>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="capitalize">
          {item.entityType.replace("_", " ")}
        </Badge>
      </TableCell>
      {metrics.length > 0 ? (
        metrics.map((metricKey) => {
          const metricDef = availableMetrics.find((m) => m.key === metricKey);
          // Extract value from both nested and flat structures
          let value = null;
          if (entityData) {
            // Try nested structure first
            value = getMetricValue(entityData?.metrics?.[item.entityType] || entityData?.metrics, metricKey);
            // If not found, try flat structure
            if (value === null) {
              value = getMetricValue(entityData, metricKey);
            }
          }
          
          return (
            <TableCell key={metricKey} className="text-right">
              <div className="flex flex-col items-end">
                <span className="text-xs text-muted-foreground">
                  {metricDef?.label || metricKey}
                </span>
                <span className="font-medium">
                  {formatMetricValue(value, metricKey)}
                </span>
              </div>
            </TableCell>
          );
        })
      ) : (
        <TableCell colSpan={3} className="text-muted-foreground text-sm">
          No metrics selected. Click "Customize Columns" to add metrics.
        </TableCell>
      )}
      <TableCell>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

export function WatchlistTable() {
  const hasHydrated = useHasHydrated();
  const getOrCreateUserId = useAppStore((state) => state.getOrCreateUserId);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedEntityType, setSelectedEntityType] = useState<
    "stock" | "mutual_fund" | "ipo" | null
  >(null);

  useEffect(() => {
    if (hasHydrated) {
      setUserId(getOrCreateUserId());
    }
  }, [hasHydrated, getOrCreateUserId]);

  const { data: items, error, isLoading, mutate } = useWatchlistItems(userId);
  const { data: stockPrefs } = useWatchlistPreferences(userId, "stock");
  const { data: mfPrefs } = useWatchlistPreferences(userId, "mutual_fund");
  const { data: ipoPrefs } = useWatchlistPreferences(userId, "ipo");

  const handleRemove = async (entityType: string, entityKey: string) => {
    if (!userId) return;
    try {
      await fetch(
        `/api/watchlist/items?userId=${encodeURIComponent(userId)}&entityType=${entityType}&entityKey=${encodeURIComponent(entityKey)}`,
        { method: "DELETE" }
      );
      mutate();
    } catch (err) {
      console.error("Failed to remove item:", err);
    }
  };

  if (!hasHydrated || isLoading) {
    return <SkeletonTable rows={5} cols={5} />;
  }

  if (error) {
    return <EmptyState title="Error loading watchlist" description={error.message} />;
  }

  if (!items || items.length === 0) {
    return (
      <EmptyState
        title="Your watchlist is empty"
        description="Search for stocks, mutual funds, or IPOs and add them to your watchlist"
      />
    );
  }

  // Group items by entity type
  const grouped = (items as WatchlistItemType[]).reduce<Record<string, WatchlistItemType[]>>(
    (acc, item) => {
      if (!acc[item.entityType]) {
        acc[item.entityType] = [];
      }
      acc[item.entityType].push(item);
      return acc;
    },
    {}
  );

  const getPreferences = (entityType: string): MetricKey[] | null => {
    if (entityType === "stock") return stockPrefs?.visibleMetricKeys || null;
    if (entityType === "mutual_fund") return mfPrefs?.visibleMetricKeys || null;
    if (entityType === "ipo") return ipoPrefs?.visibleMetricKeys || null;
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Watchlist</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedEntityType("stock")}
          >
            <Settings2 className="h-4 w-4 mr-2" />
            Stocks
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedEntityType("mutual_fund")}
          >
            <Settings2 className="h-4 w-4 mr-2" />
            Mutual Funds
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedEntityType("ipo")}
          >
            <Settings2 className="h-4 w-4 mr-2" />
            IPOs
          </Button>
        </div>
      </div>

      {Object.entries(grouped).map(([entityType, typeItems]) => {
        const preferences = getPreferences(entityType);
        const availableMetrics = getMetricsForEntityType(entityType as any);
        const visibleMetrics = preferences || availableMetrics.slice(0, 3).map((m) => m.key);

        return (
          <div key={entityType} className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold capitalize">
                {entityType.replace("_", " ")} ({typeItems.length})
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedEntityType(entityType as any)}
              >
                <Settings2 className="h-4 w-4 mr-2" />
                Customize Columns
              </Button>
            </div>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Name</TableHead>
                    <TableHead className="font-semibold">Type</TableHead>
                    {visibleMetrics.map((metricKey) => {
                      const metricDef = availableMetrics.find((m) => m.key === metricKey);
                      return (
                        <TableHead key={metricKey} className="font-semibold text-right">
                          {metricDef?.label || metricKey}
                        </TableHead>
                      );
                    })}
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {typeItems.map((item) => (
                    <WatchlistItemRow
                      key={item.id}
                      item={item}
                      preferences={visibleMetrics}
                      onRemove={() => handleRemove(item.entityType, item.entityKey)}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        );
      })}

      {selectedEntityType && (
        <WatchlistColumnSelector
          entityType={selectedEntityType}
          open={!!selectedEntityType}
          onOpenChange={(open) => !open && setSelectedEntityType(null)}
        />
      )}
    </div>
  );
}
