import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

function Shimmer({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`skeleton-shimmer ${className ?? ""}`} style={style} />;
}

export function StatCardSkeleton() {
  return (
    <Card className="retro-bevel">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Shimmer className="h-4 w-20" />
        <Shimmer className="h-4 w-4 rounded-sm" />
      </CardHeader>
      <CardContent>
        <Shimmer className="h-7 w-16" />
      </CardContent>
    </Card>
  );
}

export function ChartSkeleton() {
  return (
    <Card className="retro-bevel">
      <CardHeader>
        <Shimmer className="h-5 w-28" />
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-2 h-[200px] pt-4">
          {[40, 65, 30, 80, 55, 45, 70].map((h, i) => (
            <div key={i} className="flex-1 flex flex-col justify-end h-full">
              <Shimmer className="w-full rounded-t-sm" style={{ height: `${h}%` }} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Card key={i} className="retro-bevel">
          <CardContent className="flex items-center justify-between py-3">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Shimmer className="h-4 w-32" />
                <Shimmer className="h-5 w-16 rounded-full" />
              </div>
              <Shimmer className="h-3 w-48" />
            </div>
            <Shimmer className="h-4 w-14" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function FilterSkeleton() {
  return (
    <div className="flex flex-wrap gap-3 items-end">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-1">
          <Shimmer className="h-3 w-10" />
          <Shimmer className="h-9 w-[160px]" />
        </div>
      ))}
    </div>
  );
}

export function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
      <ChartSkeleton />
    </div>
  );
}
