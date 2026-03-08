"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface ProjectPieChartProps {
  data: {
    projectName: string;
    color: string;
    hours: number;
  }[];
}

const TOOLTIP_STYLE = {
  backgroundColor: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "6px",
  color: "var(--foreground)",
  fontSize: "13px",
  boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.5), 0 2px 8px rgba(0,0,0,0.1)",
};

export function ProjectPieChart({ data }: ProjectPieChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground">
        No data to display
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          dataKey="hours"
          nameKey="projectName"
          cx="50%"
          cy="50%"
          outerRadius={100}
          label={({ name, value }: { name?: string; value?: number }) => `${name}: ${value}h`}
          labelLine={false}
          strokeWidth={2}
          stroke="var(--card)"
          isAnimationActive={true}
          animationDuration={800}
          animationEasing="ease-out"
        >
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value?: number) => value != null ? [`${value.toFixed(1)}h`, "Hours"] : ["0h", "Hours"]}
          contentStyle={TOOLTIP_STYLE}
        />
        <Legend
          formatter={(value: string) => (
            <span style={{ color: "var(--foreground)", fontSize: "13px" }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
