"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DailyChart } from "@/components/analytics/daily-chart";
import { ProjectPieChart } from "@/components/analytics/project-pie-chart";
import { TrendChart } from "@/components/analytics/trend-chart";
import { Clock, TrendingUp, Calendar, Hash } from "lucide-react";
import { AnalyticsSkeleton } from "@/components/ui/skeleton-cards";

interface AnalyticsData {
  dailyBreakdown: { date: string; hours: number }[];
  projectBreakdown: { projectName: string; color: string; hours: number }[];
  summary: {
    totalHours: number;
    avgHoursPerDay: number;
    mostProductiveDay: string;
    totalEntries: number;
  };
}

export function AnalyticsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const period = searchParams.get("period") ?? "weekly";
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/analytics?period=${period}`)
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }, [period]);

  function setPeriod(p: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", p);
    router.push(`/analytics?${params.toString()}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-pixel text-base md:text-lg tracking-tight text-accent">Analytics</h1>
        <Tabs value={period} onValueChange={setPeriod}>
          <TabsList>
            <TabsTrigger value="daily">7 Days</TabsTrigger>
            <TabsTrigger value="weekly">This Week</TabsTrigger>
            <TabsTrigger value="monthly">This Month</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {loading || !data ? (
        <AnalyticsSkeleton />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="retro-bevel card-hover animate-card-appear">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
                <Clock className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="font-pixel text-lg text-primary">{data.summary.totalHours}h</p>
              </CardContent>
            </Card>
            <Card className="retro-bevel card-hover animate-card-appear">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Avg Per Day</CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="font-pixel text-lg text-primary">{data.summary.avgHoursPerDay}h</p>
              </CardContent>
            </Card>
            <Card className="retro-bevel card-hover animate-card-appear">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Best Day</CardTitle>
                <Calendar className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <p className="font-pixel text-lg text-accent">{data.summary.mostProductiveDay}</p>
              </CardContent>
            </Card>
            <Card className="retro-bevel card-hover animate-card-appear">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Entries</CardTitle>
                <Hash className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <p className="font-pixel text-lg text-accent">{data.summary.totalEntries}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="retro-bevel">
              <CardHeader>
                <CardTitle>Hours Per Day</CardTitle>
              </CardHeader>
              <CardContent>
                <DailyChart data={data.dailyBreakdown} />
              </CardContent>
            </Card>
            <Card className="retro-bevel">
              <CardHeader>
                <CardTitle>Time by Project</CardTitle>
              </CardHeader>
              <CardContent>
                <ProjectPieChart data={data.projectBreakdown} />
              </CardContent>
            </Card>
          </div>

          <Card className="retro-bevel">
            <CardHeader>
              <CardTitle>Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <TrendChart data={data.dailyBreakdown} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
