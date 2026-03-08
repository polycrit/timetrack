import { Suspense } from "react";
import { AnalyticsContent } from "@/components/analytics/analytics-content";

export default function AnalyticsPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center py-12 text-muted-foreground">
          Loading analytics...
        </div>
      }
    >
      <AnalyticsContent />
    </Suspense>
  );
}
