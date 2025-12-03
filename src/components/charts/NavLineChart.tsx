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

interface NavData {
  date: string;
  nav: number;
  [key: string]: string | number;
}

interface NavLineChartProps {
  data: NavData[];
  period?: "1Y" | "3Y" | "5Y";
}

export function NavLineChart({ data }: NavLineChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No NAV data available
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
          dataKey="nav"
          stroke="#00B386"
          strokeWidth={2}
          name="NAV"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
