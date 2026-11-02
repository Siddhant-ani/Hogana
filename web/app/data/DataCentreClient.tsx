"use client";

import React, { useState, useMemo } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  FileText,
  Copy,
  Check,
  Users,
  TrendingDown,
  Clock,
  Filter
} from "lucide-react";
import type { DataCentreResponse, DataCentreData } from "@/lib/dataset/data-centre-service";
import type { CommuterResearchResponse } from "@/lib/research/commuter-research-service";
import PageHeader from "@/app/components/ui/PageHeader";
import KpiCard from "@/app/components/ui/KpiCard";
import StatusBadge from "@/app/components/ui/StatusBadge";
import AlertPanel from "@/app/components/ui/AlertPanel";
import Button from "@/app/components/ui/Button";

interface DataCentreClientProps {
  initialResponse: DataCentreResponse;
  commuterResearch?: CommuterResearchResponse;
}

type TabKey =
  | "validation"
  | "commuter-research"
  | "routes.csv"
  | "stops.csv"
  | "scheduled_trips.csv"
  | "stop_times.csv"
  | "passenger_loads.csv"
  | "bus_positions.csv"
  | "vehicles.csv"
  | "crew_availability.csv"
  | "demo_assumptions.json";

export default function DataCentreClient({ initialResponse, commuterResearch }: DataCentreClientProps) {
  if (!initialResponse.success || !initialResponse.data) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 sm:p-8">
        <h3 className="text-lg font-semibold text-rose-900">Data Centre Load Failure</h3>
        <p className="text-sm text-rose-700 mt-1">
          {initialResponse.error?.message ?? "Unable to read dataset."}
        </p>
      </div>
    );
  }

  return (
    <DataCentreBrowser
      data={initialResponse.data}
      researchData={commuterResearch?.data}
    />
  );
}

function DataCentreBrowser({
  data,
  researchData,
}: {
  data: DataCentreData;
  researchData?: CommuterResearchResponse["data"];
}) {
  const [activeTab, setActiveTab] = useState<TabKey>("validation");
  const [searchQuery, setSearchQuery] = useState("");
  const [directionFilter, setDirectionFilter] = useState<"ALL" | "UP" | "DOWN">("ALL");
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [copiedJson, setCopiedJson] = useState(false);

  // Commuter research filters
  const [researchSearch, setResearchSearch] = useState("");
  const [researchProblemFilter, setResearchProblemFilter] = useState<string>("ALL");
  const [researchPage, setResearchPage] = useState(1);
  const researchPageSize = 10;

  const { datasetDate, corridor, validationReport, files, records } = data;

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    setSearchQuery("");
    setDirectionFilter("ALL");
    setCurrentPage(1);
  };

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    setCurrentPage(1);
  };

  // Extract raw rows based on activeTab
  const rawRows: Record<string, unknown>[] = useMemo(() => {
    switch (activeTab) {
      case "routes.csv":
        return records.routes as unknown as Record<string, unknown>[];
      case "stops.csv":
        return records.stops as unknown as Record<string, unknown>[];
      case "scheduled_trips.csv":
        return records.scheduledTrips as unknown as Record<string, unknown>[];
      case "stop_times.csv":
        return records.stopTimes as unknown as Record<string, unknown>[];
      case "passenger_loads.csv":
        return records.passengerLoads as unknown as Record<string, unknown>[];
      case "bus_positions.csv":
        return records.busPositions as unknown as Record<string, unknown>[];
      case "vehicles.csv":
        return records.vehicles as unknown as Record<string, unknown>[];
      case "crew_availability.csv":
        return records.crewAvailability as unknown as Record<string, unknown>[];
      default:
        return [];
    }
  }, [activeTab, records]);

  const hasDirectionCol = useMemo(() => {
    if (rawRows.length === 0) return false;
    return "direction" in rawRows[0];
  }, [rawRows]);

  const filteredRows = useMemo(() => {
    let rows = rawRows;
    if (hasDirectionCol && directionFilter !== "ALL") {
      rows = rows.filter((r) => String(r.direction).toUpperCase() === directionFilter);
    }
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase().trim();
      rows = rows.filter((r) =>
        Object.values(r).some((val) =>
          val !== null && val !== undefined && String(val).toLowerCase().includes(q)
        )
      );
    }
    return rows;
  }, [rawRows, hasDirectionCol, directionFilter, searchQuery]);

  const totalRows = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  const columns = useMemo(() => {
    if (rawRows.length === 0) return [];
    return Object.keys(rawRows[0]);
  }, [rawRows]);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(records.assumptions, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  // Filtered Commuter Profiles
  const filteredProfiles = useMemo(() => {
    if (!researchData?.sampleProfiles) return [];
    let list = researchData.sampleProfiles;

    if (researchProblemFilter !== "ALL") {
      list = list.filter((p) =>
        p.problemsFaced.toLowerCase().includes(researchProblemFilter.toLowerCase())
      );
    }

    if (researchSearch.trim()) {
      const q = researchSearch.toLowerCase().trim();
      list = list.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.occupation.toLowerCase().includes(q) ||
        p.problemsFaced.toLowerCase().includes(q) ||
        p.usualTravelTime.toLowerCase().includes(q)
      );
    }

    return list;
  }, [researchData, researchProblemFilter, researchSearch]);

  const totalResearchPages = Math.max(1, Math.ceil(filteredProfiles.length / researchPageSize));
  const paginatedProfiles = useMemo(() => {
    const start = (researchPage - 1) * researchPageSize;
    return filteredProfiles.slice(start, start + researchPageSize);
  }, [filteredProfiles, researchPage, researchPageSize]);

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <PageHeader
        badge="Data Centre"
        badgeTone="teal"
        corridor={corridor}
        title="Data Centre &amp; Audit Provenance"
        description={`Inspect the 9 validated operational source files, operational assumptions, automated validation checks, and commuter perception research for demonstration date ${datasetDate}.`}
        actions={
          <div className="flex items-center gap-2">
            {validationReport.valid ? (
              <StatusBadge
                status="56/56 Checks Verified"
                tone="success"
                size="md"
              />
            ) : (
              <StatusBadge
                status={`${validationReport.failedChecks} Checks Failed`}
                tone="danger"
                size="md"
              />
            )}
          </div>
        }
      />

      {/* Dataset Validation Failure Disclosure Banner */}
      {!validationReport.valid && (
        <AlertPanel
          severity="critical"
          title={`Dataset Integrity Alert: Validation Failed (${validationReport.failedChecks} of ${validationReport.totalChecks} checks failed)`}
          description="The operational dataset failed automated integrity checks. Operational metrics and dispatch intelligence are withheld, and data below is unvalidated demonstration data."
        />
      )}

      {/* Primary Navigation Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 p-2 shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => handleTabChange("validation")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "validation"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Step 1 Validation Suite ({validationReport.totalChecks} Checks)</span>
          </button>

          <button
            onClick={() => handleTabChange("commuter-research")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "commuter-research"
                ? "bg-teal-700 text-white shadow-xs"
                : "text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Commuter Insights — Illustrative Case Study</span>
            <span className="text-[10px] bg-teal-900/30 text-white px-1.5 py-0.2 rounded font-bold">100</span>
          </button>

          <span className="text-slate-300 mx-1 hidden sm:inline">|</span>

          {files.map((f) => (
            <button
              key={f.fileName}
              onClick={() => handleTabChange(f.fileName as TabKey)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all font-mono ${
                activeTab === f.fileName
                  ? "bg-slate-800 text-white font-semibold shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <FileText className="h-3 w-3 shrink-0" />
              <span>{f.fileName}</span>
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: Step 1 Validation Suite */}
      {activeTab === "validation" && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                Step 1 Operational Dataset Validation Report
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Full integrity audit: 56 automated checks verifying relational integrity, calendar validity, capacity bounds, and GPS continuity.
              </p>
            </div>
            <div>
              {validationReport.valid ? (
                <StatusBadge
                  status={`STATUS: VALID (${validationReport.passedChecks}/${validationReport.totalChecks} PASS)`}
                  tone="success"
                  size="md"
                />
              ) : (
                <StatusBadge
                  status={`STATUS: FAILED (${validationReport.failedChecks} CHECKS FAILED)`}
                  tone="danger"
                  size="md"
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {validationReport.checks.map((chk, i) => (
              <div
                key={i}
                className={`flex items-start justify-between p-3 rounded-lg border text-xs gap-3 ${
                  chk.passed
                    ? "bg-slate-50 border-slate-200 hover:bg-slate-100/60"
                    : "bg-rose-50 border-rose-200 hover:bg-rose-100/60"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {chk.passed ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className={`font-semibold block ${chk.passed ? "text-slate-900" : "text-rose-950"}`}>
                      Check {i + 1}: {chk.checkName}
                    </span>
                    <p className={`text-[11px] mt-0.5 font-mono ${chk.passed ? "text-slate-600" : "text-rose-800"}`}>
                      {chk.message}
                    </p>
                  </div>
                </div>
                <StatusBadge
                  status={chk.passed ? "PASS" : "FAIL"}
                  tone={chk.passed ? "success" : "danger"}
                  size="sm"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Commuter Insights — Illustrative Case Study */}
      {activeTab === "commuter-research" && researchData && (
        <div className="space-y-6">
          {/* Illustrative Disclaimer */}
          <AlertPanel
            severity="info"
            title="Illustrative Commuter Research Case Study"
            description="This research analysis is derived from 100 simulated commuter profiles calibrated for the Silk Board ↔ Hebbal corridor. It is strictly illustrative passenger perception context and segregated from operational dispatch, timetable headways, vehicle tracking, and capacity calculations."
          />

          {/* Research Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard
              label="Peak Travel Concentration"
              value={`${researchData.metrics.peakTravelPatternPct}%`}
              subValue="88 of 100 commuters"
              benchmark="Morning, evening, or dual peak commute"
              status="warning"
              icon={<Clock className="h-5 w-5 text-amber-600" />}
            />
            <KpiCard
              label="Rarely or Never Vacant Seat"
              value={`${researchData.metrics.rarelyOrNeverVacantPct}%`}
              subValue="77 of 100 commuters"
              benchmark="Report buses arriving full without seated room"
              status="alert"
              icon={<TrendingDown className="h-5 w-5 text-rose-600" />}
            />
            <KpiCard
              label="Corridor Profiles Sampled"
              value={researchData.metrics.sampleProfiles}
              subValue="Silk Board ↔ Hebbal"
              benchmark="Cross-sectional commuter archetype coverage"
              status="neutral"
              icon={<Users className="h-5 w-5 text-teal-600" />}
            />
          </div>

          {/* 10 Aggregated Commuter Pain Points */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="mb-4">
              <h2 className="text-base font-bold text-slate-900">
                10 Core Commuter Pain Points (Reported Frequencies)
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Surveyed friction points highlighting how headway irregularity and crush occupancy directly impact daily riders.
              </p>
            </div>

            <div className="space-y-3">
              {researchData.commuterPainPoints.map((point) => (
                <div key={point.rank} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 w-5">#{point.rank}</span>
                      <span className="text-xs font-bold text-slate-900">{point.problem}</span>
                      <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-medium">
                        {point.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-teal-700">{point.mentions} mentions</span>
                      <span className="text-xs text-slate-500 font-medium">({point.percentage}%)</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-1.5">
                    <div
                      className={`h-full rounded-full ${
                        point.rank <= 2
                          ? "bg-rose-500"
                          : point.rank <= 5
                          ? "bg-amber-500"
                          : "bg-teal-600"
                      }`}
                      style={{ width: `${point.percentage}%` }}
                    />
                  </div>

                  <p className="text-[11px] text-slate-600 italic">
                    <strong className="text-slate-700">Operational relevance:</strong> {point.operationalRelevance}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 100 Sample Profiles Explorer */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Illustrative Commuter Profiles Explorer (100 Respondents)
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Filter and inspect individual simulated respondent feedback, commute times, and reported friction.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search commuter..."
                    value={researchSearch}
                    onChange={(e) => {
                      setResearchSearch(e.target.value);
                      setResearchPage(1);
                    }}
                    className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 w-44"
                  />
                </div>

                {/* Problem Filter */}
                <div className="flex items-center gap-1.5">
                  <Filter className="h-3.5 w-3.5 text-slate-400" />
                  <select
                    value={researchProblemFilter}
                    onChange={(e) => {
                      setResearchProblemFilter(e.target.value);
                      setResearchPage(1);
                    }}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="ALL">All Challenges</option>
                    <option value="Overcrowding">Overcrowding</option>
                    <option value="waiting time">Long Waiting</option>
                    <option value="traffic">Traffic Delays</option>
                    <option value="bunching">Bus Bunching</option>
                    <option value="skip">Buses Skip Stops</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Profiles Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                    <th className="py-2.5 px-3">Commuter</th>
                    <th className="py-2.5 px-3">Age / Gender</th>
                    <th className="py-2.5 px-3">Occupation</th>
                    <th className="py-2.5 px-3">Travel Pattern</th>
                    <th className="py-2.5 px-3">Seat Availability</th>
                    <th className="py-2.5 px-3">Reported Problems</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {paginatedProfiles.length > 0 ? (
                    paginatedProfiles.map((p) => (
                      <tr key={p.respondentId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2 px-3 text-center font-mono text-slate-400 text-[11px]">
                          {p.respondentId}
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-900">{p.name}</td>
                        <td className="py-2 px-3 text-slate-600">
                          {p.age} yrs • {p.gender}
                        </td>
                        <td className="py-2 px-3 text-slate-700">{p.occupation}</td>
                        <td className="py-2 px-3">
                          <span className="font-medium text-slate-800">{p.travelFrequency}</span>
                          <span className="block text-[10px] text-slate-500">{p.usualTravelTime}</span>
                        </td>
                        <td className="py-2 px-3">
                          <StatusBadge
                            status={p.busFoundVacant}
                            tone={
                              p.busFoundVacant === "Never"
                                ? "danger"
                                : p.busFoundVacant === "Rarely"
                                ? "warning"
                                : "neutral"
                            }
                            size="sm"
                          />
                        </td>
                        <td className="py-2 px-3 max-w-xs text-[11px] text-slate-600 line-clamp-2">
                          {p.problemsFaced}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        No commuter profiles matched your search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredProfiles.length > 0 && (
              <div className="flex items-center justify-between mt-3 text-xs text-slate-600">
                <span>
                  Showing {(researchPage - 1) * researchPageSize + 1} to{" "}
                  {Math.min(researchPage * researchPageSize, filteredProfiles.length)} of{" "}
                  {filteredProfiles.length} profiles
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={researchPage <= 1}
                    onClick={() => setResearchPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <span className="px-2 text-slate-700 font-medium">
                    Page {researchPage} of {totalResearchPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={researchPage >= totalResearchPages}
                    onClick={() => setResearchPage((p) => Math.min(totalResearchPages, p + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: demo_assumptions.json */}
      {activeTab === "demo_assumptions.json" && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100 mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 font-mono">demo_assumptions.json</h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Authoritative operating thresholds, corridor endpoints, and demonstration parameters.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyJson}
              leftIcon={copiedJson ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            >
              {copiedJson ? "Copied JSON" : "Copy JSON"}
            </Button>
          </div>

          <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-xs font-mono leading-relaxed max-h-[500px]">
            {JSON.stringify(records.assumptions, null, 2)}
          </pre>
        </div>
      )}

      {/* TAB: CSV Operational Records Browser */}
      {activeTab !== "validation" &&
        activeTab !== "commuter-research" &&
        activeTab !== "demo_assumptions.json" && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 font-mono">{activeTab}</h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Showing {filteredRows.length} total records (derived from canonical repository data).
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Direction filter */}
                {hasDirectionCol && (
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                    {(["ALL", "UP", "DOWN"] as const).map((dir) => (
                      <button
                        key={dir}
                        onClick={() => {
                          setDirectionFilter(dir);
                          setCurrentPage(1);
                        }}
                        className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                          directionFilter === dir
                            ? "bg-white text-slate-900 shadow-xs font-bold"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        {dir}
                      </button>
                    ))}
                  </div>
                )}

                {/* Search */}
                <div className="relative">
                  <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search records..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white w-48 sm:w-60"
                  />
                </div>

                {/* Page Size */}
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value={10}>10 / page</option>
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                  <option value={100}>100 / page</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto mt-4 max-h-[600px] border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100/80 sticky top-0 border-b border-slate-200 z-10">
                  <tr>
                    <th className="py-2.5 px-3 text-slate-500 font-semibold w-12 text-center">#</th>
                    {columns.map((col) => (
                      <th
                        key={col}
                        className="py-2.5 px-3 text-slate-700 font-semibold uppercase tracking-wider text-[11px] font-mono"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {paginatedRows.length > 0 ? (
                    paginatedRows.map((row, idx) => {
                      const rowNumber = (currentPage - 1) * pageSize + idx + 1;
                      return (
                        <tr key={idx} className="hover:bg-teal-50/30 transition-colors">
                          <td className="py-2 px-3 text-slate-400 text-center font-mono text-[11px]">
                            {rowNumber}
                          </td>
                          {columns.map((col) => {
                            const val = row[col];
                            const isNull = val === null || val === undefined;
                            return (
                              <td key={col} className="py-2 px-3 font-mono text-[11px] whitespace-nowrap">
                                {isNull ? (
                                  <span className="text-slate-400 italic">null</span>
                                ) : typeof val === "boolean" ? (
                                  <span
                                    className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${
                                      val ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"
                                    }`}
                                  >
                                    {String(val)}
                                  </span>
                                ) : (
                                  String(val)
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={columns.length + 1} className="py-8 text-center text-slate-500">
                        No records match the current filter or search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalRows > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600">
                <div>
                  Showing <strong>{(currentPage - 1) * pageSize + 1}</strong> to{" "}
                  <strong>{Math.min(currentPage * pageSize, totalRows)}</strong> of{" "}
                  <strong>{totalRows}</strong> entries
                </div>

                <div className="flex items-center gap-1 self-end sm:self-auto">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <span className="px-3 py-1 font-medium text-slate-800">
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="p-1.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
    </div>
  );
}
