import React, { Suspense } from "react";
import { getInterventionsData } from "@/lib/engine/interventions-service";
import InterventionsClient from "./InterventionsClient";

export const metadata = {
  title: "Interventions — HOGANA Smart Bus Operations",
  description: "Dispatcher advisory intervention proposals and human review workflow for Silk Board ↔ Hebbal corridor."
};

export default async function InterventionsPage() {
  const response = await getInterventionsData();

  if (!response.success || !response.data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 sm:p-8">
        <h3 className="text-lg font-semibold text-red-900">Interventions Load Failure</h3>
        <p className="text-sm text-red-700 mt-1">
          {response.error?.message ?? "Unable to compute intervention proposals."}
        </p>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Loading intervention proposals...</div>}>
      <InterventionsClient initialData={response.data} />
    </Suspense>
  );
}
