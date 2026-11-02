import { Suspense } from "react";
import { getDataCentreData } from "@/lib/dataset/data-centre-service";
import { getCommuterResearchData } from "@/lib/research/commuter-research-service";
import DataCentreClient from "./DataCentreClient";

export default async function DataPage() {
  const [initialResponse, commuterResearch] = await Promise.all([
    getDataCentreData(),
    getCommuterResearchData(),
  ]);

  return (
    <Suspense
      fallback={
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-500 animate-pulse">
          Loading Data Centre records...
        </div>
      }
    >
      <DataCentreClient initialResponse={initialResponse} commuterResearch={commuterResearch} />
    </Suspense>
  );
}
