"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface AllocationData {
  name: string;
  value: number;
  [key: string]: string | number;
}

interface AllocationPieChartProps {
  data: AllocationData[];
}

const COLORS = ["#00B386", "#4C6FFF", "#FF6B6B", "#FFD93D", "#6BCF7F"];

export function AllocationPieChart({ data }: AllocationPieChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No allocation data available
      </div>
    );
  }

  const renderLabel = (props: any) => {
    const { name, percent } = props;
    return `${name || ""} ${((percent || 0) * 100).toFixed(0)}%`;
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderLabel}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
