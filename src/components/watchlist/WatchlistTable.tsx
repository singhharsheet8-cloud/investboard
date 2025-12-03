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
import { Trash2, Settings2 } from "lucide-react";
import { useWatchlistItems } from "@/lib/swr-fetchers";
import { useAppStore, useHasHydrated } from "@/lib/store";
import { SkeletonTable } from "@/components/common/SkeletonTable";
import { EmptyState } from "@/components/common/EmptyState";
import { WatchlistColumnSelector } from "./WatchlistColumnSelector";
import Link from "next/link";

interface WatchlistItemType {
  id: string;
  entityType: string;
  entityKey: string;
}

export function WatchlistTable() {
  const hasHydrated = useHasHydrated();
  const getOrCreateUserId = useAppStore((state) => state.getOrCreateUserId);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (hasHydrated) {
      setUserId(getOrCreateUserId());
    }
  }, [hasHydrated, getOrCreateUserId]);

  const { data: items, error, isLoading, mutate } = useWatchlistItems(userId);
  const [selectedEntityType, setSelectedEntityType] = useState<
    "stock" | "mutual_fund" | "ipo" | null
  >(null);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Watchlist</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedEntityType("mutual_fund")}
        >
          <Settings2 className="h-4 w-4 mr-2" />
          Customize Columns
        </Button>
      </div>

      {Object.entries(grouped).map(([entityType, typeItems]) => (
        <div key={entityType} className="space-y-2">
          <h3 className="text-lg font-semibold capitalize">{entityType.replace("_", " ")}</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {typeItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Link
                      href={`/${entityType === "mutual_fund" ? "mutual-funds" : entityType}s/${item.entityKey}`}
                      className="hover:underline"
                    >
                      {item.entityKey}
                    </Link>
                  </TableCell>
                  <TableCell className="capitalize">
                    {entityType.replace("_", " ")}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(item.entityType, item.entityKey)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ))}

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
