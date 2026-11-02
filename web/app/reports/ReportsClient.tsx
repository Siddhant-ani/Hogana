"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Download,
  Printer,
  Calendar,
  AlertTriangle,
  MapPin,
  Clock,
  CheckCircle2,
  Table as TableIcon,
  History
} from "lucide-react";
import type { ReportsData, OperationalReport } from "@/lib/engine/reports-service";

interface ReportsClientProps {
  initialData: ReportsData;
}

import {
  LocalStoredReview,
  LocalStoredSimRun,
  isValidLocalReview,
  isValidLocalSimRun,
  formatSafeDate
} from "@/lib/engine/report-validators";

export type { LocalStoredReview, LocalStoredSimRun };

export default function ReportsClient({ initialData }: ReportsClientProps) {
  const [selectedReportType, setSelectedReportType] = useState<
    "eod" | "morning" | "evening" | "simulation" | "reviews" | "sim_runs"
  >("eod");

  const [localReviews, setLocalReviews] = useState<LocalStoredReview[]>([]);
  const [localSimRuns, setLocalSimRuns] = useState<LocalStoredSimRun[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const rawReviews = localStorage.getItem("hogana_intervention_reviews_v1");
        if (rawReviews) {
          const parsed = JSON.parse(rawReviews);
          if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            const valid = Object.values(parsed).filter(isValidLocalReview);
            setLocalReviews(valid);
          }
        }
      } catch (e) {
        console.warn("Unable to read local reviews for reports:", e);
      }

      try {
        const rawRuns = localStorage.getItem("hogana_simulation_history_v1");
        if (rawRuns) {
          const parsed = JSON.parse(rawRuns);
          if (Array.isArray(parsed)) {
            const valid = parsed.filter(isValidLocalSimRun);
            setLocalSimRuns(valid);
          }
        }
      } catch (e) {
        console.warn("Unable to read local simulation history for reports:", e);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Standard server-generated reports
  const standardReport: OperationalReport | undefined =
    selectedReportType !== "reviews" && selectedReportType !== "sim_runs"
      ? initialData.reports[selectedReportType]
      : undefined;

  const handleDownloadCsv = () => {
    let csvContent = "";
    let filename = "";

    if (standardReport) {
      csvContent = standardReport.csvData;
      filename = `${standardReport.reportId.toLowerCase()}.csv`;
    } else if (selectedReportType === "reviews") {
      filename = "hogana-local-demonstration-reviews.csv";
      const headers = ["ProposalId", "Decision", "ReviewNote", "ReviewedAt"];
      const lines = [headers.join(",")];
      for (const r of localReviews) {
        if (!isValidLocalReview(r)) continue;
        const note = `"${String(r.reviewNote ?? "").replace(/"/g, '""')}"`;
        lines.push([String(r.proposalId ?? ""), String(r.decision ?? ""), note, String(r.reviewedAt ?? "")].join(","));
      }
      csvContent = lines.join("\n");
    } else if (selectedReportType === "sim_runs") {
      filename = "hogana-local-demonstration-simruns.csv";
      const headers = ["RunId", "ScenarioType", "Summary", "Details", "SimulatedAt"];
      const lines = [headers.join(",")];
      for (const s of localSimRuns) {
        if (!isValidLocalSimRun(s)) continue;
        const summary = `"${String(s.summary ?? "").replace(/"/g, '""')}"`;
        const details = `"${String(s.details ?? "").replace(/"/g, '""')}"`;
        lines.push([String(s.id ?? ""), String(s.scenarioType ?? ""), summary, details, String(s.simulatedAt ?? "")].join(","));
      }
      csvContent = lines.join("\n");
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadJson = () => {
    let jsonString = "";
    let filename = "";

    if (standardReport) {
      jsonString = JSON.stringify(standardReport, null, 2);
      filename = `${standardReport.reportId.toLowerCase()}.json`;
    } else if (selectedReportType === "reviews") {
      filename = "hogana-local-demonstration-reviews.json";
      const validReviews = localReviews.filter(isValidLocalReview);
      jsonString = JSON.stringify(
        {
          reportId: "REP-DEMO-REVIEWS",
          title: "Local Demonstration Dispatcher Review Audit Log",
          disclaimer:
            "Demonstration review records are stored locally in this browser. They are not official BMTC approvals or shared operational records.",
          totalReviews: validReviews.length,
          reviews: validReviews
        },
        null,
        2
      );
    } else if (selectedReportType === "sim_runs") {
      filename = "hogana-local-demonstration-simruns.json";
      const validRuns = localSimRuns.filter(isValidLocalSimRun);
      jsonString = JSON.stringify(
        {
          reportId: "REP-DEMO-SIMRUNS",
          title: "Local Demonstration Scenario Simulation Runs Log",
          disclaimer:
            "Simulation run records are stored locally in this browser. They are not official BMTC operational records.",
          totalRuns: validRuns.length,
          runs: validRuns
        },
        null,
        2
      );
    }

    const blob = new Blob([jsonString], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Non-Printable Header & Controls Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6 print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 rounded px-2 py-0.5">
                Operational Reports &amp; Exports
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-medium">Silk Board ↔ Hebbal (19.8 km)</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Corridor Operations Performance Reports
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              Inspect and export formal performance audit reports. Download structured tabular CSV or complete JSON representations, or print directly to PDF.
            </p>
          </div>

          {/* Export & Print Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadCsv}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors shadow-xs"
              title="Download tabular report as CSV"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" />
              <span>Download CSV</span>
            </button>

            <button
              onClick={handleDownloadJson}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors shadow-xs"
              title="Download structured report as JSON"
            >
              <FileText className="h-3.5 w-3.5 text-slate-500" />
              <span>Download JSON</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors"
              title="Print document or Save to PDF"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print / Save PDF</span>
            </button>
          </div>
        </div>

        {/* Report Type Selector Tabs */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
          {[
            { id: "eod", label: "End-of-Day Audit Report", icon: CheckCircle2 },
            { id: "morning", label: "Morning Peak Replay (08:24)", icon: Clock },
            { id: "evening", label: "Evening Peak Replay (18:15)", icon: Clock },
            { id: "simulation", label: "Scenario Simulation Matrix", icon: TableIcon },
            { id: "reviews", label: `Review History (${localReviews.length})`, icon: History },
            { id: "sim_runs", label: `Saved Sim Runs (${localSimRuns.length})`, icon: History }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = selectedReportType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedReportType(tab.id as typeof selectedReportType)}
                className={`
                  flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all
                  ${
                    isActive
                      ? "bg-teal-600 text-white shadow-xs font-bold"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }
                `}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* STANDARD SERVER-GENERATED REPORT VIEW */}
      {standardReport && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 print:border-none print:shadow-none print:p-0">
          {/* Document Header */}
          <div className="border-b border-slate-200 pb-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
              <div>
                <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                  DOCUMENT: {standardReport.reportId}
                </span>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-1">
                  {standardReport.title}
                </h2>
              </div>
              <div className="text-left sm:text-right text-xs text-slate-500 space-y-0.5">
                <p className="flex items-center gap-1.5 sm:justify-end">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  <span>{standardReport.corridor}</span>
                </p>
                <p className="flex items-center gap-1.5 sm:justify-end">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <span>Demonstration Date: <strong>{standardReport.evaluationDate}</strong></span>
                </p>
                <p className="font-mono text-[11px] text-slate-400">
                  Evaluation Timestamp: {standardReport.evaluationTimestamp}
                </p>
              </div>
            </div>

            {/* Mandatory Provenance & Demonstration Disclaimer */}
            <div className="mt-3 p-3 rounded-lg bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Mandatory Compliance Notice:</strong> {standardReport.disclaimer} All metrics, observations, and recommendations are evaluated deterministically from approved synthetic corridor demonstration data for 10 March 2025.
              </p>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Executive Summary
            </h3>
            <p className="text-xs sm:text-sm text-slate-800 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
              {standardReport.executiveSummary}
            </p>
          </div>

          {/* Key Operational KPIs Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Key Operational Performance Indicators (KPIs)
            </h3>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3">Performance Metric</th>
                    <th className="p-3">Evaluated Value</th>
                    <th className="p-3">Operational Benchmark</th>
                    <th className="p-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {standardReport.kpis.map((kpi, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-3 font-semibold text-slate-900">{kpi.metric}</td>
                      <td className="p-3 font-mono font-bold text-slate-900">{kpi.value}</td>
                      <td className="p-3 text-slate-600">{kpi.benchmark}</td>
                      <td className="p-3 text-right">
                        <span
                          className={`font-semibold px-2 py-0.5 rounded text-[10px] uppercase ${
                            kpi.status === "optimal"
                              ? "bg-emerald-100 text-emerald-800"
                              : kpi.status === "warning"
                              ? "bg-amber-100 text-amber-800"
                              : kpi.status === "alert"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {kpi.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detailed Sections */}
          {standardReport.sections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-2 pt-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {section.heading}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {section.description}
                </p>
              </div>

              {section.rows.length > 0 && (
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                      <tr>
                        {Object.keys(section.rows[0]).map((h) => (
                          <th key={h} className="p-3">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {section.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-50">
                          {Object.values(row).map((val, cIdx) => (
                            <td key={cIdx} className="p-3 font-mono text-[11px]">
                              {String(val)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}

          {/* Document Footer */}
          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[11px] text-slate-400">
            <p>HOGANA Operational Intelligence Platform • Generated for 10 March 2025</p>
            <p className="font-mono">Audit Record: {standardReport.reportId} • Confidential Demonstration</p>
          </div>
        </div>
      )}

      {/* LOCAL REVIEW HISTORY AUDIT REPORT */}
      {selectedReportType === "reviews" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 print:border-none print:shadow-none print:p-0">
          <div className="border-b border-slate-200 pb-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
              <div>
                <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                  DOCUMENT: REP-DEMO-REVIEWS
                </span>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-1">
                  Local Demonstration Dispatcher Review Audit Log
                </h2>
              </div>
              <div className="text-left sm:text-right text-xs text-slate-500 space-y-0.5">
                <p>Silk Board ↔ Hebbal Corridor</p>
                <p>Recorded Reviews: <strong>{localReviews.length}</strong></p>
              </div>
            </div>

            <div className="mt-3 p-3 rounded-lg bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Demonstration Boundary Disclosure:</strong> Demonstration review records are stored locally in this browser. They are not official BMTC approvals, automated dispatch triggers, or shared operational records.
              </p>
            </div>
          </div>

          {localReviews.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
              No review decisions recorded in this browser session. Navigate to Interventions to approve or reject proposals.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3">Proposal ID</th>
                    <th className="p-3">Review Decision</th>
                    <th className="p-3">Reviewer Operational Note</th>
                    <th className="p-3">Local Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {localReviews.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-slate-900">{r.proposalId}</td>
                      <td className="p-3">
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                            r.decision === "approved"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : "bg-rose-100 text-rose-800 border border-rose-300"
                          }`}
                        >
                          {r.decision}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-slate-700 italic">
                        &ldquo;{r.reviewNote}&rdquo;
                      </td>
                      <td className="p-3 font-mono text-[11px] text-slate-500">
                        {formatSafeDate(r.reviewedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* LOCAL SIMULATION RUNS LOG REPORT */}
      {selectedReportType === "sim_runs" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 print:border-none print:shadow-none print:p-0">
          <div className="border-b border-slate-200 pb-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
              <div>
                <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                  DOCUMENT: REP-DEMO-SIMRUNS
                </span>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-1">
                  Local Demonstration Scenario Simulation Runs Log
                </h2>
              </div>
              <div className="text-left sm:text-right text-xs text-slate-500 space-y-0.5">
                <p>Silk Board ↔ Hebbal Corridor</p>
                <p>Recorded Simulation Runs: <strong>{localSimRuns.length}</strong></p>
              </div>
            </div>

            <div className="mt-3 p-3 rounded-lg bg-teal-50/80 border border-teal-200 text-xs text-teal-950 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Demonstration Boundary Disclosure:</strong> Simulation run records are stored locally in this browser. They reflect user-selected simulation inputs evaluated against approved mathematical constraints.
              </p>
            </div>
          </div>

          {localSimRuns.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
              No simulation runs recorded in this browser session. Navigate to Simulation and click &quot;Save Simulation Run&quot; to log outcomes.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3">Run ID</th>
                    <th className="p-3">Scenario</th>
                    <th className="p-3">Summary Input</th>
                    <th className="p-3">Deterministic Outcome Details</th>
                    <th className="p-3">Local Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {localSimRuns.map((s, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-slate-900">{s.id}</td>
                      <td className="p-3 font-semibold uppercase text-[10px] text-teal-800">
                        {s.scenarioType}
                      </td>
                      <td className="p-3 font-medium text-slate-900">{s.summary}</td>
                      <td className="p-3 font-mono text-[11px] text-slate-700">{s.details}</td>
                      <td className="p-3 font-mono text-[11px] text-slate-500">
                        {formatSafeDate(s.simulatedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
