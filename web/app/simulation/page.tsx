import React, { Suspense } from "react";
import { getSimulationBaselineData } from "@/lib/engine/simulation-service";
import SimulationClient from "./SimulationClient";

export const metadata = {
  title: "Simulation — HOGANA Smart Bus Operations",
  description: "Deterministic operational intervention sandbox and scenario impact analysis for Silk Board ↔ Hebbal corridor."
};

export default async function SimulationPage() {
  const response = await getSimulationBaselineData();

  if (!response.success || !response.data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 sm:p-8">
        <h3 className="text-lg font-semibold text-red-900">Simulation Baseline Load Failure</h3>
        <p className="text-sm text-red-700 mt-1">
          {response.error?.message ?? "Unable to assemble operational simulation baseline data."}
        </p>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Loading scenario simulator...</div>}>
      <SimulationClient initialData={response.data} />
    </Suspense>
  );
}
