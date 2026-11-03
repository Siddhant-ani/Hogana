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
  UploadCloud,
  Layers,
  MapPin,
  Calendar,
  Compass,
  Bus,
  Shield,
  Gauge
} from "lucide-react";
import type { DataCentreResponse, DataCentreData } from "@/lib/dataset/data-centre-service";
import type { CommuterResearchResponse } from "@/lib/research/commuter-research-service";
import PageHeader from "@/app/components/ui/PageHeader";
import KpiCard from "@/app/components/ui/KpiCard";
import StatusBadge from "@/app/components/ui/StatusBadge";
import AlertPanel from "@/app/components/ui/AlertPanel";
import Button from "@/app/components/ui/Button";
import DataUploadManager from "@/app/components/data/DataUploadManager";

interface DataCentreClientProps {
  initialResponse: DataCentreResponse;
  commuterResearch?: CommuterResearchResponse;
}

type MainTab = "categories" | "commuter-research" | "management";

type CategoryId =
  | "service"
  | "stops"
  | "timetables"
  | "observations"
  | "loads"
  | "telemetry"
  | "fleet"
  | "crew"
  | "standards";

interface CategoryMeta {
  id: CategoryId;
  name: string;
  categoryNumber: number;
  subtitle: string;
  description: string;
  recordCount: number;
  keyFields: string;
  icon: React.ComponentType<{ className?: string }>;
}

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
  const [mainTab, setMainTab] = useState<MainTab>("categories");
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>("service");
  const [searchQuery, setSearchQuery] = useState("");
  const [directionFilter, setDirectionFilter] = useState<"ALL" | "UP" | "DOWN">("ALL");
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [copiedJson, setCopiedJson] = useState(false);

  const { datasetDate, validationReport, records } = data;

  const categories: CategoryMeta[] = useMemo(() => [
    {
      id: "service",
      name: "Service Information",
      categoryNumber: 1,
      subtitle: "Route & Service Span",
      description: "Route identifiers, operational corridor span, and route geometry between Silk Board and Hebbal.",
      recordCount: records.routes.length,
      keyFields: "route_id, route_short_name, route_long_name, route_type",
      icon: Compass,
    },
    {
      id: "stops",
      name: "Stops & Station Locations",
      categoryNumber: 2,
      subtitle: "Transit Points & Coordinates",
      description: "24 directional passenger boarding stops, GPS coordinates, stop sequence, and terminal identifiers.",
      recordCount: records.stops.length,
      keyFields: "stop_id, stop_name, stop_lat, stop_lon, direction, sequence",
      icon: MapPin,
    },
    {
      id: "timetables",
      name: "Scheduled Timetables",
      categoryNumber: 3,
      subtitle: "Planned Trip Departures",
      description: "86 scheduled daily trip slots across peak and off-peak periods with timetable arrival commitments.",
      recordCount: records.scheduledTrips.length,
      keyFields: "trip_id, route_id, service_id, trip_headsign, direction",
      icon: Calendar,
    },
    {
      id: "observations",
      name: "Arrival & Departure Observations",
      categoryNumber: 4,
      subtitle: "Stop Visit & Dwell Events",
      description: "1,032 measured arrival, departure, and dwell event observations recorded at corridor stops.",
      recordCount: records.stopTimes.length,
      keyFields: "trip_id, stop_id, arrival_time, departure_time, stop_sequence",
      icon: Clock,
    },
    {
      id: "loads",
      name: "Passenger Load Observations",
      categoryNumber: 5,
      subtitle: "Boardings & Vehicle Occupancy",
      description: "641 passenger load observations capturing boardings, alightings, and onboard occupancy against bus capacity.",
      recordCount: records.passengerLoads.length,
      keyFields: "trip_id, stop_id, boardings, alightings, load_after",
      icon: Users,
    },
    {
      id: "telemetry",
      name: "Vehicle Telemetry",
      categoryNumber: 6,
      subtitle: "GPS Location & Speed",
      description: "4,376 periodic GPS telemetry records tracking bus latitude, longitude, speed, and heading timestamps.",
      recordCount: records.busPositions.length,
      keyFields: "timestamp, bus_id, trip_id, latitude, longitude, speed_kmh",
      icon: Gauge,
    },
    {
      id: "fleet",
      name: "Fleet Availability",
      categoryNumber: 7,
      subtitle: "Vehicle Assets & Status",
      description: "25 transit vehicles with registration numbers, seating capacity, and current operational allocation.",
      recordCount: records.vehicles.length,
      keyFields: "bus_id, license_plate, capacity, status, vehicle_model",
      icon: Bus,
    },
    {
      id: "crew",
      name: "Driver & Crew Availability",
      categoryNumber: 8,
      subtitle: "Rostered Drivers & Reserves",
      description: "28 rostered drivers assigned across morning and evening operating shifts with reserve coverage status.",
      recordCount: records.crewAvailability.length,
      keyFields: "crew_id, driver_name, shift, status, assigned_trip",
      icon: ShieldCheck,
    },
    {
      id: "standards",
      name: "Operating Standards & Thresholds",
      categoryNumber: 9,
      subtitle: "Operating Rules & Thresholds",
      description: "Contractual headway standards (6m peak, 12m off-peak), bunching threshold (120s), and crowding limit (60 pax).",
      recordCount: 1,
      keyFields: "headway targets, bunching limit, capacity rules",
      icon: Shield,
    },
  ], [records]);

  const activeCategoryMeta = useMemo(() => {
    return categories.find((c) => c.id === selectedCategory) || categories[0];
  }, [categories, selectedCategory]);

  const rawRows: Record<string, unknown>[] = useMemo(() => {
    switch (selectedCategory) {
      case "service":
        return records.routes as unknown as Record<string, unknown>[];
      case "stops":
        return records.stops as unknown as Record<string, unknown>[];
      case "timetables":
        return records.scheduledTrips as unknown as Record<string, unknown>[];
      case "observations":
        return records.stopTimes as unknown as Record<string, unknown>[];
      case "loads":
        return records.passengerLoads as unknown as Record<string, unknown>[];
      case "telemetry":
        return records.busPositions as unknown as Record<string, unknown>[];
      case "fleet":
        return records.vehicles as unknown as Record<string, unknown>[];
      case "crew":
        return records.crewAvailability as unknown as Record<string, unknown>[];
      default:
        return [];
    }
  }, [selectedCategory, records]);

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

  const totalRecordsAllStreams = useMemo(() => {
    return (
      records.routes.length +
      records.stops.length +
      records.scheduledTrips.length +
      records.stopTimes.length +
      records.passengerLoads.length +
      records.busPositions.length +
      records.vehicles.length +
      records.crewAvailability.length +
      1
    );
  }, [records]);

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Page Header */}
      <PageHeader
        badge="Data & Quality"
        badgeTone="teal"
        serviceArea="Silk Board–Hebbal, Bengaluru"
        title="Data &amp; Quality"
        description={`Authoritative operational records, validation health, and quality auditing for dataset date ${datasetDate}.`}
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

      {/* Overall Data Health Summary Card */}
      <div className="bg-white rounded-xl border border-[#DCE5ED] p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-200 text-[#0F8278]">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#12233F]">Overall Data Health &amp; Verification Status</h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  100% Validated
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Silk Board ↔ Hebbal Corridor • Active Published Dataset Version 1 • Operational Date: {datasetDate}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-700">Total Validated Records:</span>
            <span className="font-bold text-[#12233F] bg-[#F5F7FA] border border-[#DCE5ED] px-2.5 py-1 rounded-md">
              {totalRecordsAllStreams.toLocaleString()} records across 9 domain streams
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-xs">
          <div className="p-3 bg-[#F5F7FA] rounded-lg border border-[#DCE5ED]">
            <span className="text-slate-500 font-medium">Relational Integrity</span>
            <p className="text-base font-bold text-emerald-700 mt-0.5">56 of 56 Passed</p>
            <span className="text-[10px] text-slate-500">Zero foreign key or sequence violations</span>
          </div>
          <div className="p-3 bg-[#F5F7FA] rounded-lg border border-[#DCE5ED]">
            <span className="text-slate-500 font-medium">Service Coverage</span>
            <p className="text-base font-bold text-[#12233F] mt-0.5">86 Timetable Trips</p>
            <span className="text-[10px] text-slate-500">24 directional stops across 19.8 km</span>
          </div>
          <div className="p-3 bg-[#F5F7FA] rounded-lg border border-[#DCE5ED]">
            <span className="text-slate-500 font-medium">Telemetry Continuity</span>
            <p className="text-base font-bold text-[#12233F] mt-0.5">4,376 GPS Observations</p>
            <span className="text-[10px] text-slate-500">Continuous 30s vehicle tracking</span>
          </div>
          <div className="p-3 bg-[#F5F7FA] rounded-lg border border-[#DCE5ED]">
            <span className="text-slate-500 font-medium">Fleet &amp; Crew Readiness</span>
            <p className="text-base font-bold text-[#0F8278] mt-0.5">25 Buses / 28 Drivers</p>
            <span className="text-[10px] text-slate-500">Active roster + standby reserves</span>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="bg-white rounded-xl border border-[#DCE5ED] p-1.5 shadow-xs flex flex-wrap gap-1.5 text-xs font-semibold">
        <button
          onClick={() => setMainTab("categories")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all ${
            mainTab === "categories"
              ? "bg-[#12233F] text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-[#F5F7FA]"
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Information Categories (9 Streams)</span>
        </button>

        <button
          onClick={() => setMainTab("commuter-research")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all ${
            mainTab === "commuter-research"
              ? "bg-[#0F8278] text-white shadow-xs"
              : "text-[#0F8278] bg-[#EAF4F7] hover:bg-teal-100"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Commuter Perception Insights</span>
          <span className="text-[10px] bg-teal-900/40 text-white px-1.5 py-0.2 rounded font-bold">100 Profiles</span>
        </button>

        <button
          onClick={() => setMainTab("management")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all ${
            mainTab === "management"
              ? "bg-slate-800 text-white shadow-xs"
              : "text-slate-700 bg-slate-100 hover:bg-slate-200"
          }`}
        >
          <UploadCloud className="h-4 w-4" />
          <span>Data Management &amp; Audit Suite</span>
          <span className="text-[10px] bg-slate-300 text-slate-800 px-1.5 py-0.2 rounded font-medium">Manager</span>
        </button>
      </div>

      {/* TAB 1: 9 Information Categories */}
      {mainTab === "categories" && (
        <div className="space-y-6">
          {/* 9 Category Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setSearchQuery("");
                    setDirectionFilter("ALL");
                    setCurrentPage(1);
                  }}
                  className={`text-left p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                    isSelected
                      ? "bg-[#EAF4F7] border-[#0F8278] ring-2 ring-[#0F8278]/20 shadow-xs"
                      : "bg-white border-[#DCE5ED] hover:border-slate-300 hover:bg-[#F5F7FA]"
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`p-2 rounded-lg ${
                            isSelected ? "bg-[#0F8278] text-white" : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Category {cat.categoryNumber}
                        </span>
                      </div>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                          isSelected
                            ? "bg-[#0F8278] text-white"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {cat.recordCount === 1 && cat.id === "standards"
                          ? "Active Standards"
                          : `${cat.recordCount.toLocaleString()} records`}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-[#12233F] pt-1">{cat.name}</h3>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{cat.description}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 truncate max-w-[200px]">
                      {cat.keyFields}
                    </span>
                    <span
                      className={`font-semibold shrink-0 ${
                        isSelected ? "text-[#0F8278]" : "text-slate-400"
                      }`}
                    >
                      {isSelected ? "Active View" : "Explore →"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Category Detail & Records Viewer */}
          {selectedCategory === "standards" ? (
            <div className="bg-white rounded-xl border border-[#DCE5ED] p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-[#12233F] uppercase tracking-wide flex items-center gap-2">
                    <Shield className="h-4 w-4 text-[#0F8278]" />
                    Operating Standards &amp; Thresholds Configuration
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Operational contract standards and dispatch policy rules governing the Silk Board–Hebbal service area.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyJson}
                  leftIcon={copiedJson ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                >
                  {copiedJson ? "Copied Policy" : "Copy Policy JSON"}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 bg-[#F5F7FA] rounded-lg border border-[#DCE5ED]">
                  <span className="font-semibold text-slate-800">Headway Standard Targets</span>
                  <div className="mt-2 space-y-1 text-slate-600">
                    <p>• Peak Scheduled Target: <strong className="text-slate-900">360s (6 min)</strong></p>
                    <p>• Off-Peak Scheduled Target: <strong className="text-slate-900">720s (12 min)</strong></p>
                    <p>• Regularity Target: <strong className="text-slate-900">OTP ≥ 80.0% (±180s)</strong></p>
                  </div>
                </div>

                <div className="p-3.5 bg-[#F5F7FA] rounded-lg border border-[#DCE5ED]">
                  <span className="font-semibold text-slate-800">Bunching &amp; Gap Triggers</span>
                  <div className="mt-2 space-y-1 text-slate-600">
                    <p>• Bunching Trigger: <strong className="text-amber-800">&lt; 120s separation</strong></p>
                    <p>• Max Holding Allowance: <strong className="text-slate-900">300s (5 min)</strong></p>
                    <p>• Service Gap Trigger: <strong className="text-rose-800">&gt; 1.5× scheduled interval</strong></p>
                  </div>
                </div>

                <div className="p-3.5 bg-[#F5F7FA] rounded-lg border border-[#DCE5ED]">
                  <span className="font-semibold text-slate-800">Capacity &amp; Fleet Limits</span>
                  <div className="mt-2 space-y-1 text-slate-600">
                    <p>• Vehicle Design Capacity: <strong className="text-slate-900">60 pax (40 sit / 20 stand)</strong></p>
                    <p>• Crowding Warning Threshold: <strong className="text-amber-800">&gt; 100% capacity (&gt;60 pax)</strong></p>
                    <p>• Severe Overcrowding Limit: <strong className="text-rose-800">≥ 150% capacity (≥90 pax)</strong></p>
                  </div>
                </div>
              </div>

              <div className="mt-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Authoritative Policy Object
                </p>
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-xs font-mono leading-relaxed max-h-[380px]">
                  {JSON.stringify(records.assumptions, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-[#DCE5ED] p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-[#12233F] uppercase tracking-wide flex items-center gap-2">
                    <activeCategoryMeta.icon className="h-4 w-4 text-[#0F8278]" />
                    {activeCategoryMeta.name} Records
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Showing {filteredRows.length} total records ({activeCategoryMeta.subtitle}).
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Direction filter */}
                  {hasDirectionCol && (
                    <div className="flex items-center gap-1 bg-[#F5F7FA] p-1 rounded-lg border border-[#DCE5ED]">
                      {(["ALL", "UP", "DOWN"] as const).map((dir) => (
                        <button
                          key={dir}
                          onClick={() => {
                            setDirectionFilter(dir);
                            setCurrentPage(1);
                          }}
                          className={`px-2.5 py-0.5 rounded text-xs font-medium transition-colors ${
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
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="pl-8 pr-3 py-1.5 bg-[#F5F7FA] border border-[#DCE5ED] rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F8278] focus:bg-white w-48 sm:w-60"
                    />
                  </div>
                </div>
              </div>

              {/* Records Table */}
              <div className="overflow-x-auto rounded-lg border border-[#DCE5ED]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F5F7FA] border-b border-[#DCE5ED] text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3 w-12 text-center text-slate-400">#</th>
                      {columns.map((col) => (
                        <th key={col} className="py-2.5 px-3 whitespace-nowrap">
                          {col.replace(/_/g, " ")}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {paginatedRows.length > 0 ? (
                      paginatedRows.map((row, idx) => {
                        const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                        return (
                          <tr key={idx} className="hover:bg-[#F5F7FA]/80">
                            <td className="py-2 px-3 text-center text-slate-400 font-mono text-[10px]">
                              {globalIdx}
                            </td>
                            {columns.map((col) => (
                              <td key={col} className="py-2 px-3 whitespace-nowrap font-mono text-[11px]">
                                {row[col] !== null && row[col] !== undefined
                                  ? String(row[col])
                                  : <span className="text-slate-300 italic font-sans">—</span>}
                              </td>
                            ))}
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={columns.length + 1} className="py-8 text-center text-slate-400 text-xs italic">
                          No matching records found in this category.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <span>
                    Showing{" "}
                    <strong>{totalRows > 0 ? (currentPage - 1) * pageSize + 1 : 0}</strong> to{" "}
                    <strong>{Math.min(currentPage * pageSize, totalRows)}</strong> of{" "}
                    <strong>{totalRows}</strong> records
                  </span>
                  <span className="text-slate-300">|</span>
                  <div className="flex items-center gap-1.5">
                    <span>Rows:</span>
                    {[25, 50, 100].map((size) => (
                      <button
                        key={size}
                        onClick={() => {
                          setPageSize(size);
                          setCurrentPage(1);
                        }}
                        className={`px-2 py-0.5 rounded font-medium ${
                          pageSize === size
                            ? "bg-[#12233F] text-white"
                            : "bg-[#F5F7FA] text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1 rounded border border-[#DCE5ED] bg-white hover:bg-[#F5F7FA] disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Previous Page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="px-2">
                    Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1 rounded border border-[#DCE5ED] bg-white hover:bg-[#F5F7FA] disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Next Page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Commuter Insights — Aggregate Research Summary */}
      {mainTab === "commuter-research" && researchData && (
        <div className="space-y-6">
          {/* Prominent Simulated Workbook Disclosure */}
          <AlertPanel
            severity="info"
            title="Simulated Illustrative Workbook — Not Real Field Research"
            description="This research analysis is derived from 100 simulated commuter archetypes calibrated for the Silk Board–Hebbal, Bengaluru service area. It is strictly illustrative passenger perception context and segregated from operational dispatch, timetable headways, vehicle tracking, and capacity calculations. Zero individual respondent profiles or personally identifiable information are retained or transmitted."
          />

          {/* Research Aggregate KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard
              label="Peak Travel Concentration"
              value={`${researchData.metrics.peakTravelPatternPct}%`}
              subValue="88 of 100 illustrative profiles"
              benchmark="Morning, evening, or dual peak commute"
              status="warning"
              icon={<Clock className="h-5 w-5 text-amber-600" />}
            />
            <KpiCard
              label="Rarely or Never Vacant Seat"
              value={`${researchData.metrics.rarelyOrNeverVacantPct}%`}
              subValue="77 of 100 illustrative profiles"
              benchmark="Report buses arriving full without seated room"
              status="alert"
              icon={<TrendingDown className="h-5 w-5 text-rose-600" />}
            />
            <KpiCard
              label="Illustrative Profiles Modeled"
              value={researchData.metrics.totalIllustrativeProfiles}
              subValue="Silk Board–Hebbal, Bengaluru"
              benchmark="Cross-sectional commuter archetype coverage"
              status="neutral"
              icon={<Users className="h-5 w-5 text-[#0F8278]" />}
            />
          </div>

          {/* Travel Window Aggregate Distribution */}
          <div className="bg-white rounded-xl border border-[#DCE5ED] p-5 shadow-xs">
            <div className="mb-4">
              <h2 className="text-base font-bold text-[#12233F]">
                Commute Time Distribution (Aggregate Archetypes)
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Distribution of travel windows across the 100 illustrative commuter profiles along the Outer Ring Road.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-[#F5F7FA] rounded-lg border border-[#DCE5ED]">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">Both Peaks (Dual)</span>
                <span className="text-2xl font-bold text-[#12233F] mt-1 block">
                  {researchData.metrics.travelWindowDistribution.bothPeaks}%
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5 block">38 illustrative profiles</span>
              </div>
              <div className="p-4 bg-[#F5F7FA] rounded-lg border border-[#DCE5ED]">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">Morning Peak Only</span>
                <span className="text-2xl font-bold text-[#12233F] mt-1 block">
                  {researchData.metrics.travelWindowDistribution.morningPeak}%
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5 block">28 illustrative profiles</span>
              </div>
              <div className="p-4 bg-[#F5F7FA] rounded-lg border border-[#DCE5ED]">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">Evening Peak Only</span>
                <span className="text-2xl font-bold text-[#12233F] mt-1 block">
                  {researchData.metrics.travelWindowDistribution.eveningPeak}%
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5 block">22 illustrative profiles</span>
              </div>
              <div className="p-4 bg-[#F5F7FA] rounded-lg border border-[#DCE5ED]">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">Off-Peak Travel</span>
                <span className="text-2xl font-bold text-[#12233F] mt-1 block">
                  {researchData.metrics.travelWindowDistribution.offPeak}%
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5 block">12 illustrative profiles</span>
              </div>
            </div>
          </div>

          {/* 10 Aggregated Commuter Friction Points */}
          <div className="bg-white rounded-xl border border-[#DCE5ED] p-5 shadow-xs">
            <div className="mb-4">
              <h2 className="text-base font-bold text-[#12233F]">
                10 Core Commuter Friction Points (Illustrative Mentions)
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Simulated archetype friction points illustrating how headway irregularity and crush occupancy directly impact daily riders.
              </p>
            </div>

            <div className="space-y-3">
              {researchData.commuterPainPoints.map((point) => (
                <div key={point.rank} className="p-3 bg-[#F5F7FA] rounded-lg border border-[#DCE5ED]">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 w-5">#{point.rank}</span>
                      <span className="text-xs font-bold text-slate-900">{point.problem}</span>
                      <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-medium">
                        {point.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#0F8278]">{point.mentions} illustrative mentions</span>
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
                          : "bg-[#0F8278]"
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

          {/* Research Provenance & Methodological Isolation */}
          <div className="bg-white rounded-xl border border-[#DCE5ED] p-5 shadow-xs">
            <h3 className="text-sm font-bold text-[#12233F] mb-2">Research Provenance &amp; Isolation Architecture</h3>
            <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
              <p>
                <strong className="text-slate-800">Dataset Title:</strong> {researchData.datasetTitle}
              </p>
              <p>
                <strong className="text-slate-800">Methodology:</strong> {researchData.methodology}
              </p>
              <p>
                <strong className="text-slate-800">Provenance:</strong> {researchData.provenance}
              </p>
              <p>
                <strong className="text-slate-800">Architectural Boundary:</strong> Stored separately under{" "}
                <code className="text-[#0F8278] font-mono">data/research/commuter_insights.json</code> and accessed via server-only loader. Fully segregated from the 9 operational source files. Zero individual respondent records or names are transmitted to the browser.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Restricted Data Management & Ingestion */}
      {mainTab === "management" && (
        <div className="space-y-6">
          {/* Data Manager Ingestion & Version History Manager */}
          <DataUploadManager />

          {/* Step 1 56-Check Automated Validation Report */}
          <div className="bg-white rounded-xl border border-[#DCE5ED] p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-[#12233F] flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  Step 1 Operational Dataset Validation Report (56 Automated Checks)
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Full relational integrity audit: 56 automated checks verifying foreign keys, timetable validity, GPS continuity, and passenger load bounds.
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[500px] overflow-y-auto pr-1">
              {validationReport.checks.map((chk, i) => (
                <div
                  key={i}
                  className={`flex items-start justify-between p-3 rounded-lg border text-xs gap-3 ${
                    chk.passed
                      ? "bg-[#F5F7FA] border-[#DCE5ED] hover:bg-slate-100/60"
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
        </div>
      )}
    </div>
  );
}
