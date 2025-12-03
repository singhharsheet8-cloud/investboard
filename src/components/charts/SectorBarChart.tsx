"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface SectorData {
  name: string;
  weight: number;
  [key: string]: string | number;
}

interface SectorBarChartProps {
  data: SectorData[];
}

export function SectorBarChart({ data }: SectorBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No sector data available
      </div>
    );
  }

  // Sort by weight and take top 5
  const topSectors = [...data]
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={topSectors} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" tick={{ fontSize: 12 }} />
        <YAxis
          dataKey="name"
          type="category"
          width={100}
          tick={{ fontSize: 12 }}
        />
        <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
        <Legend />
        <Bar dataKey="weight" fill="#00B386" name="Weight %" />
      </BarChart>
    </ResponsiveContainer>
  );
}
