"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface RiskReturnData {
  name: string;
  risk: number;
  return: number;
  [key: string]: string | number;
}

interface RiskReturnScatterProps {
  data: RiskReturnData[];
}

export function RiskReturnScatter({ data }: RiskReturnScatterProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No risk-return data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ScatterChart>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          type="number"
          dataKey="risk"
          name="Risk"
          label={{ value: "Risk (Volatility)", position: "insideBottom", offset: -5 }}
          tick={{ fontSize: 12 }}
        />
        <YAxis
          type="number"
          dataKey="return"
          name="Return"
          label={{ value: "Return (%)", angle: -90, position: "insideLeft" }}
          tick={{ fontSize: 12 }}
        />
        <Tooltip
          cursor={{ strokeDasharray: "3 3" }}
          formatter={(value: number, name: string) => {
            if (name === "return") return `${value.toFixed(2)}%`;
            return value.toFixed(2);
          }}
        />
        <Legend />
        <Scatter name="Risk vs Return" data={data} fill="#00B386">
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill="#00B386" />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}
