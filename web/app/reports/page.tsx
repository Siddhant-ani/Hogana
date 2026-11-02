import React, { Suspense } from "react";
import { getReportsData } from "@/lib/engine/reports-service";
import ReportsClient from "./ReportsClient";

export const metadata = {
  title: "Reports — HOGANA Smart Bus Operations",
  description: "Operational performance audit reports, CSV/JSON exports, and printable summaries for Silk Board–Hebbal, Bengaluru service area."
};

export default async function ReportsPage() {
  const response = await getReportsData();

  if (!response.success || !response.data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 sm:p-8">
        <h3 className="text-lg font-semibold text-red-900">Reports Generation Failure</h3>
        <p className="text-sm text-red-700 mt-1">
          {response.error?.message ?? "Unable to assemble operational reports."}
        </p>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Loading operational reports...</div>}>
      <ReportsClient initialData={response.data} />
    </Suspense>
  );
}
