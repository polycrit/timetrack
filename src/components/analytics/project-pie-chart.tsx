"use client";

import { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface ChildBreakdown {
  projectName: string;
  color: string;
  hours: number;
}

interface ProjectBreakdownItem {
  projectName: string;
  color: string;
  hours: number;
  children?: ChildBreakdown[];
}

interface ProjectPieChartProps {
  data: ProjectBreakdownItem[];
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
  const [drillDown, setDrillDown] = useState<{ name: string; children: ChildBreakdown[] } | null>(null);

  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground">
        No data to display
      </div>
    );
  }

  const chartData = drillDown ? drillDown.children : data;

  function handleClick(entry: ProjectBreakdownItem) {
    if (!drillDown && entry.children && entry.children.length > 0) {
      setDrillDown({ name: entry.projectName, children: entry.children });
    }
  }

  return (
    <div>
      {drillDown && (
        <div className="flex items-center gap-2 mb-2">
          <Button variant="ghost" size="sm" onClick={() => setDrillDown(null)}>
            <ArrowLeft className="mr-1 h-3 w-3" />
            Back
          </Button>
          <span className="text-sm text-muted-foreground">{drillDown.name}</span>
        </div>
      )}
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
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
            onClick={(_: unknown, index: number) => {
              if (!drillDown) handleClick(data[index]);
            }}
            style={!drillDown ? { cursor: "pointer" } : undefined}
          >
            {chartData.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => value != null ? [`${Number(value).toFixed(1)}h`, "Hours"] : ["0h", "Hours"]}
            contentStyle={TOOLTIP_STYLE}
          />
          <Legend
            formatter={(value: string) => (
              <span style={{ color: "var(--foreground)", fontSize: "13px" }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
