"use client";

import { MetricBadge } from "./MetricBadge";

interface KeyValue {
  key: string;
  label: string;
  value: number | string | null;
  tooltip?: string;
  positiveIsGood?: boolean;
}

interface KeyValueGridProps {
  items: KeyValue[];
  columns?: 2 | 3 | 4;
}

export function KeyValueGrid({ items, columns = 3 }: KeyValueGridProps) {
  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-4",
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-4`}>
      {items.map((item) => (
        <MetricBadge
          key={item.key}
          label={item.label}
          value={item.value}
          tooltip={item.tooltip}
          positiveIsGood={item.positiveIsGood}
        />
      ))}
    </div>
  );
}

