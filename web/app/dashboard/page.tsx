import { Suspense } from "react";
import { getDashboardData } from "@/lib/engine/dashboard-service";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const [eodResponse, morningResponse, eveningResponse] = await Promise.all([
    getDashboardData("eod"),
    getDashboardData("morning"),
    getDashboardData("evening")
  ]);

  const responses = {
    eod: eodResponse,
    morning: morningResponse,
    evening: eveningResponse
  };

  return (
    <Suspense
      fallback={
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-500 animate-pulse">
          Loading operations control dashboard...
        </div>
      }
    >
      <DashboardClient responses={responses} />
    </Suspense>
  );
}
