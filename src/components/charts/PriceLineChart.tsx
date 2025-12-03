"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface PriceData {
  date: string;
  price: number;
  [key: string]: string | number;
}

interface PriceLineChartProps {
  data: PriceData[];
  period?: "1D" | "1W" | "1M" | "1Y" | "5Y";
}

export function PriceLineChart({ data }: PriceLineChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No price data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => {
            const date = new Date(value);
            return date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
          }}
        />
        <YAxis
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => `₹${value.toFixed(2)}`}
        />
        <Tooltip
          formatter={(value: number) => `₹${value.toFixed(2)}`}
          labelFormatter={(label) => new Date(label).toLocaleDateString()}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="price"
          stroke="#4C6FFF"
          strokeWidth={2}
          name="Price"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
