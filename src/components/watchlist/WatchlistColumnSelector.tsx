"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useWatchlistPreferences } from "@/lib/swr-fetchers";
import { useAppStore, useHasHydrated } from "@/lib/store";
import { getMetricsForEntityType, MetricKey } from "@/lib/watchlist-metrics";

interface WatchlistColumnSelectorProps {
  entityType: "stock" | "mutual_fund" | "ipo";
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WatchlistColumnSelector({
  entityType,
  open,
  onOpenChange,
}: WatchlistColumnSelectorProps) {
  const hasHydrated = useHasHydrated();
  const getOrCreateUserId = useAppStore((state) => state.getOrCreateUserId);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (hasHydrated) {
      setUserId(getOrCreateUserId());
    }
  }, [hasHydrated, getOrCreateUserId]);

  const { data: preferences, mutate } = useWatchlistPreferences(userId, entityType);
  const [selectedMetrics, setSelectedMetrics] = useState<MetricKey[]>([]);

  const availableMetrics = getMetricsForEntityType(entityType);

  useEffect(() => {
    if (preferences?.visibleMetricKeys) {
      setSelectedMetrics(preferences.visibleMetricKeys);
    } else {
      // Default: select first 5 metrics
      setSelectedMetrics(availableMetrics.slice(0, 5).map((m) => m.key));
    }
  }, [preferences, entityType, availableMetrics]);

  const handleSave = async () => {
    if (!userId) return;
    try {
      await fetch("/api/watchlist/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          entityType,
          visibleMetricKeys: selectedMetrics,
        }),
      });
      mutate();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save preferences:", error);
    }
  };

  const toggleMetric = (key: MetricKey) => {
    setSelectedMetrics((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Customize {entityType.replace("_", " ")} Columns</DialogTitle>
          <DialogDescription>
            Select which metrics to display in your watchlist table
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {availableMetrics.map((metric) => (
            <div
              key={metric.key}
              className="flex items-center space-x-2 p-2 hover:bg-muted rounded"
            >
              <Checkbox
                id={metric.key}
                checked={selectedMetrics.includes(metric.key)}
                onCheckedChange={() => toggleMetric(metric.key)}
              />
              <label
                htmlFor={metric.key}
                className="flex-1 cursor-pointer"
              >
                <div className="font-medium">{metric.label}</div>
                {metric.tooltip && (
                  <div className="text-sm text-muted-foreground">
                    {metric.tooltip}
                  </div>
                )}
              </label>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!userId}>
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
