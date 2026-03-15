"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DailyChartProps {
  data: { date: string; hours: number }[];
}

const TOOLTIP_STYLE = {
  backgroundColor: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "6px",
  color: "var(--foreground)",
  fontSize: "13px",
  boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.5), 0 2px 8px rgba(0,0,0,0.1)",
};

export function DailyChart({ data }: DailyChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground">
        No data to display
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
        <XAxis dataKey="date" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
        <YAxis unit="h" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
        <Tooltip
          formatter={(value) => value != null ? [`${Number(value).toFixed(1)}h`, "Hours"] : ["0h", "Hours"]}
          contentStyle={TOOLTIP_STYLE}
          cursor={{ fill: "var(--muted)", opacity: 0.3 }}
        />
        <Bar
          dataKey="hours"
          fill="var(--primary)"
          radius={[4, 4, 0, 0]}
          isAnimationActive={true}
          animationDuration={800}
          animationEasing="ease-out"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
