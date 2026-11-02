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
  Sliders,
  Copy,
  Check
} from "lucide-react";
import type { DataCentreResponse, DataCentreData } from "@/lib/dataset/data-centre-service";

interface DataCentreClientProps {
  initialResponse: DataCentreResponse;
}

type TabKey =
  | "validation"
  | "routes.csv"
  | "stops.csv"
  | "scheduled_trips.csv"
  | "stop_times.csv"
  | "passenger_loads.csv"
  | "bus_positions.csv"
  | "vehicles.csv"
  | "crew_availability.csv"
  | "demo_assumptions.json";

export default function DataCentreClient({ initialResponse }: DataCentreClientProps) {
  if (!initialResponse.success || !initialResponse.data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 sm:p-8">
        <h3 className="text-lg font-semibold text-red-900">Data Centre Load Failure</h3>
        <p className="text-sm text-red-700 mt-1">
          {initialResponse.error?.message ?? "Unable to read dataset."}
        </p>
      </div>
    );
  }

  return <DataCentreBrowser data={initialResponse.data} />;
}

function DataCentreBrowser({ data }: { data: DataCentreData }) {
  const [activeTab, setActiveTab] = useState<TabKey>("validation");
  const [searchQuery, setSearchQuery] = useState("");
  const [directionFilter, setDirectionFilter] = useState<"ALL" | "UP" | "DOWN">("ALL");
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [copiedJson, setCopiedJson] = useState(false);

  const { datasetName, datasetDate, corridor, validationReport, files, records } = data;

  // Reset pagination on tab change or search
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

  const handleDirectionFilterChange = (dir: "ALL" | "UP" | "DOWN") => {
    setDirectionFilter(dir);
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

  // Filter rows
  const filteredRows = useMemo(() => {
    if (activeTab === "validation" || activeTab === "demo_assumptions.json") {
      return [];
    }

    let rows = rawRows;

    // Filter by direction if present in records
    if (directionFilter !== "ALL") {
      rows = rows.filter((r) => r.direction === directionFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      rows = rows.filter((row) =>
        Object.values(row).some((val) =>
          val !== null && val !== undefined && String(val).toLowerCase().includes(q)
        )
      );
    }

    return rows;
  }, [activeTab, rawRows, directionFilter, searchQuery]);

  // Paginated slice
  const totalRows = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  // Column headers
  const columns = useMemo(() => {
    if (rawRows.length === 0) return [];
    return Object.keys(rawRows[0]);
  }, [rawRows]);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(records.assumptions, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Overview Card (§6.A) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 rounded px-2 py-0.5">
                Data Centre &amp; Provenance
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-medium">{corridor}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {datasetName}
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              Inspect approved source files, relational entities, operational assumptions, and Step 1 validation audit checks for demonstration date <strong>{datasetDate}</strong>.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {validationReport.valid ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-right">
                <div className="flex items-center gap-1.5 justify-end">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-900">Validation Passed</span>
                </div>
                <p className="text-xs text-emerald-700 font-medium mt-0.5">
                  {validationReport.passedChecks} of {validationReport.totalChecks} Checks Verified
                </p>
              </div>
            ) : (
              <div className="bg-rose-50 border border-rose-300 rounded-lg p-3 text-right">
                <div className="flex items-center gap-1.5 justify-end">
                  <AlertCircle className="h-4 w-4 text-rose-600" />
                  <span className="text-xs font-bold text-rose-900">Validation Failed</span>
                </div>
                <p className="text-xs text-rose-700 font-medium mt-0.5">
                  {validationReport.failedChecks} failed of {validationReport.totalChecks} checks
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 9 Files Summary Badges */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
            Approved Dataset Files ({files.length} Source Files)
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-xs">
            {files.map((f) => (
              <button
                key={f.fileName}
                onClick={() => handleTabChange(f.fileName as TabKey)}
                className={`
                  p-2.5 rounded-lg border text-left transition-all
                  ${
                    activeTab === f.fileName
                      ? "bg-teal-50/80 border-teal-300 text-teal-950 font-semibold shadow-xs"
                      : "bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100"
                  }
                `}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[11px] truncate">{f.fileName}</span>
                  <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-1 rounded">
                    {f.recordCount} {f.fileType === "json" ? "file" : "rows"}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 line-clamp-1">{f.description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Dataset Validation Failure Disclosure Banner */}
      {!validationReport.valid && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs text-rose-900">
            <p className="font-bold">
              Dataset Integrity Alert: Validation Failed ({validationReport.failedChecks} of {validationReport.totalChecks} checks failed)
            </p>
            <p className="mt-1 text-rose-800">
              The operational dataset failed automated integrity checks. Operational metrics and dispatch intelligence are withheld, and data below is unvalidated demonstration data.
            </p>
            {validationReport.errors && validationReport.errors.length > 0 && (
              <ul className="mt-2 list-disc list-inside space-y-0.5 font-mono text-[11px] text-rose-700">
                {validationReport.errors.slice(0, 5).map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
                {validationReport.errors.length > 5 && (
                  <li>...and {validationReport.errors.length - 5} more errors</li>
                )}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Main Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 pb-2">
        <button
          onClick={() => handleTabChange("validation")}
          className={`
            flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all
            ${
              activeTab === "validation"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }
          `}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>Step 1 Validation Suite (56 Checks)</span>
        </button>

        <span className="text-slate-300 mx-1">|</span>

        {files.map((f) => (
          <button
            key={f.fileName}
            onClick={() => handleTabChange(f.fileName as TabKey)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all font-mono
              ${
                activeTab === f.fileName
                  ? "bg-teal-600 text-white font-semibold shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }
            `}
          >
            <FileText className="h-3 w-3 shrink-0" />
            <span>{f.fileName}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: Step 1 Validation Suite (§6.C) */}
      {activeTab === "validation" && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100 mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                Step 1 Operational Dataset Validation Report
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Full integrity audit: 56 automated checks verifying relational alignment, calendar validity, capacity bounds, and GPS continuity.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {validationReport.valid ? (
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded px-2.5 py-1">
                  STATUS: VALID ({validationReport.passedChecks}/{validationReport.totalChecks} PASS)
                </span>
              ) : (
                <span className="text-xs font-bold text-rose-800 bg-rose-50 border border-rose-300 rounded px-2.5 py-1">
                  STATUS: FAILED ({validationReport.failedChecks} CHECKS FAILED)
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {validationReport.checks.map((chk, i) => (
              <div
                key={i}
                className={`flex items-start justify-between p-3 rounded-lg border text-xs gap-3 ${
                  chk.passed
                    ? "bg-slate-50 border-slate-200 hover:bg-slate-100/60"
                    : "bg-rose-50/70 border-rose-200 hover:bg-rose-50"
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
                <span
                  className={`shrink-0 text-[10px] font-bold rounded px-2 py-0.5 border ${
                    chk.passed
                      ? "text-emerald-800 bg-emerald-100 border-emerald-300"
                      : "text-rose-800 bg-rose-100 border-rose-300"
                  }`}
                >
                  {chk.passed ? "PASS" : "FAIL"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: demo_assumptions.json Organized Cards + Raw JSON (§6.B) */}
      {activeTab === "demo_assumptions.json" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sliders className="h-5 w-5 text-teal-600" />
                  Operational Assumptions &amp; Corridor Parameters
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Approved operational rules, service constraints, financial rates, and dispatch thresholds from <code className="font-mono">demo_assumptions.json</code>.
                </p>
              </div>
              <button
                onClick={handleCopyJson}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                {copiedJson ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-slate-500" />
                    <span>Copy JSON</span>
                  </>
                )}
              </button>
            </div>

            {/* Organized Assumptions Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Card 1: Headway Targets */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-xs space-y-2">
                <span className="font-bold text-slate-800 uppercase tracking-wider block">
                  Headway &amp; Timetable Targets
                </span>
                <div className="space-y-1.5 text-slate-700">
                  <p>• <strong>Peak Target Headway:</strong> {Math.round(records.assumptions.headway.nominal_peak_headway_seconds / 60)} minutes ({records.assumptions.headway.nominal_peak_headway_seconds}s)</p>
                  <p>• <strong>Off-Peak Target Headway:</strong> {Math.round(records.assumptions.headway.nominal_offpeak_headway_seconds / 60)} minutes ({records.assumptions.headway.nominal_offpeak_headway_seconds}s)</p>
                  <p>• <strong>Bunching Threshold:</strong> &lt; {records.assumptions.headway.bunching_threshold_seconds}s separation</p>
                  <p>• <strong>Large Gap Multiplier:</strong> &gt; {records.assumptions.headway.large_gap_multiplier}× nominal scheduled headway</p>
                </div>
              </div>

              {/* Card 2: Dispatch & Geofence Control */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-xs space-y-2">
                <span className="font-bold text-slate-800 uppercase tracking-wider block">
                  Dispatch &amp; Holding Control
                </span>
                <div className="space-y-1.5 text-slate-700">
                  <p>• <strong>Max Delay Tolerance:</strong> {records.assumptions.dispatch_control.max_delay_tolerance_seconds}s (300s holding allowance)</p>
                  <p>• <strong>Min Viable Hold:</strong> {records.assumptions.dispatch_control.min_viable_hold_seconds}s</p>
                  <p>• <strong>Geofence Radius:</strong> {records.assumptions.dispatch_control.geofence_dwelling_radius_meters}m from landmark</p>
                  <p>• <strong>Telemetry Freshness:</strong> ≤ {records.assumptions.dispatch_control.telemetry_freshness_seconds}s age required</p>
                </div>
              </div>

              {/* Card 3: Passenger Crowding Thresholds */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-xs space-y-2">
                <span className="font-bold text-slate-800 uppercase tracking-wider block">
                  Passenger Crowding Thresholds
                </span>
                <div className="space-y-1.5 text-slate-700">
                  <p>• <strong>Vehicle Design Capacity:</strong> 60 passengers (40 seated + 20 standing)</p>
                  <p>• <strong>Overcrowding Warning:</strong> {records.assumptions.crowding.overcrowding_pct}% of capacity (60 passengers)</p>
                  <p>• <strong>Severe Overcrowding:</strong> {records.assumptions.crowding.severe_overcrowding_pct}% of capacity (90 passengers)</p>
                  <p>• <strong>Frequency Increase Trigger:</strong> ≥ 3 consecutive severely overcrowded stops</p>
                </div>
              </div>

              {/* Card 4: Operating Rules & Simulation Defaults */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-xs space-y-2">
                <span className="font-bold text-slate-800 uppercase tracking-wider block">
                  Operating Window &amp; Cycle Times
                </span>
                <div className="space-y-1.5 text-slate-700">
                  <p>• <strong>Operating Day Span:</strong> 06:00 to 22:00 (16 operating hours)</p>
                  <p>• <strong>Standard Travel Time:</strong> 55 minutes per directional trip</p>
                  <p>• <strong>Baseline Cycle Time:</strong> {records.assumptions.simulator_defaults.baseline_cycle_time_minutes} minutes</p>
                  <p>• <strong>Interval Convention:</strong> {records.assumptions.time_window_rules.interval_convention}</p>
                </div>
              </div>

              {/* Card 5: Financial Assumptions */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-xs space-y-2">
                <span className="font-bold text-slate-800 uppercase tracking-wider block">
                  Operational Financial Baseline
                </span>
                <div className="space-y-1.5 text-slate-700">
                  <p>• <strong>Daily Fare Revenue per Bus:</strong> ₹{records.assumptions.financial.fare_revenue_per_bus_per_day_inr.toLocaleString()}</p>
                  <p>• <strong>Cost per Bus-Hour:</strong> {records.assumptions.financial.cost_per_bus_hour_inr ? `₹${records.assumptions.financial.cost_per_bus_hour_inr.toLocaleString()}` : '₹1,250 (illustrative)'}</p>
                  <p>• <strong>Fixed Schedule Capacity Loss:</strong> {records.assumptions.financial.capacity_loss_fixed_schedule_pct}%</p>
                  <p>• <strong>Dynamic Dispatch Capacity Loss:</strong> {records.assumptions.financial.capacity_loss_dynamic_dispatch_pct}%</p>
                </div>
              </div>

              {/* Card 6: Synthetic Provenance */}
              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-xs space-y-2">
                <span className="font-bold text-amber-900 uppercase tracking-wider block">
                  Synthetic Provenance Disclosure
                </span>
                <div className="space-y-1.5 text-amber-900">
                  <p>• <strong>Source Label:</strong> synthetic</p>
                  <p>• <strong>Dataset Scope:</strong> Silk Board ↔ Hebbal (19.8 km, Outer Ring Road)</p>
                  <p>• <strong>Provenance Statement:</strong> {records.assumptions._provenance}</p>
                </div>
              </div>
            </div>

            {/* Formatted Raw JSON */}
            <div className="mt-6 pt-4 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Raw JSON Schema View
              </p>
              <pre className="p-4 rounded-lg bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto max-h-96">
                {JSON.stringify(records.assumptions, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3-10: CSV Datasets Browsing (§6.B) */}
      {activeTab !== "validation" && activeTab !== "demo_assumptions.json" && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          {/* Table Header & Controls Bar */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 font-mono">
                {activeTab}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Showing {totalRows} records • Primary Key: {files.find((f) => f.fileName === activeTab)?.primaryKey}
              </p>
            </div>

            {/* Controls: Search, Direction Filter, Page Size */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Direction Filter (if table contains direction) */}
              {columns.includes("direction") && (
                <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 text-xs">
                  <span className="text-slate-500 text-[10px] uppercase font-bold px-1.5">Dir:</span>
                  {(["ALL", "UP", "DOWN"] as const).map((dir) => (
                    <button
                      key={dir}
                      onClick={() => handleDirectionFilterChange(dir)}
                      className={`
                        px-2 py-0.5 rounded font-medium text-xs transition-colors
                        ${
                          directionFilter === dir
                            ? "bg-white text-slate-900 shadow-xs font-bold"
                            : "text-slate-600 hover:text-slate-900"
                        }
                      `}
                    >
                      {dir}
                    </button>
                  ))}
                </div>
              )}

              {/* Search Input */}
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

              {/* Page Size Select */}
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

          {/* Table Container */}
          <div className="overflow-x-auto mt-4 max-h-[600px] border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100/80 sticky top-0 border-b border-slate-200 z-10">
                <tr>
                  <th className="py-2.5 px-3 text-slate-500 font-semibold w-12 text-center">#</th>
                  {columns.map((col) => (
                    <th key={col} className="py-2.5 px-3 text-slate-700 font-semibold uppercase tracking-wider text-[11px] font-mono">
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
                                <span className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${val ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"}`}>
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
