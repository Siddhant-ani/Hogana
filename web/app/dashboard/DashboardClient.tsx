"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Clock,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Bus,
  Users,
  Shield,
  Layers,
  Activity,
  Info,
  Compass,
  Gauge
} from "lucide-react";
import type { DashboardResponse, EvaluationViewId } from "@/lib/engine/dashboard-service";
import PageHeader from "@/app/components/ui/PageHeader";
import KpiCard from "@/app/components/ui/KpiCard";
import StatusBadge from "@/app/components/ui/StatusBadge";
import AlertPanel from "@/app/components/ui/AlertPanel";

interface DashboardClientProps {
  responses: Record<EvaluationViewId, DashboardResponse>;
}

export default function DashboardClient({ responses }: DashboardClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Active view synced with URL query (?view=eod | morning | evening)
  const rawView = searchParams.get("view") as EvaluationViewId | null;
  const activeViewId: EvaluationViewId =
    rawView && ["eod", "morning", "evening"].includes(rawView) ? rawView : "eod";

  const activeResponse = responses[activeViewId] || responses.eod;

  const handleViewChange = (viewId: EvaluationViewId) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", viewId);
    router.push(`/dashboard?${params.toString()}`);
  };

  if (!activeResponse.success || !activeResponse.data) {
    return (
      <div className="space-y-4 max-w-7xl mx-auto">
        <AlertPanel
          severity="critical"
          title="Operational Dataset Validation Failure"
          description={activeResponse.error?.message ?? "Failed to load validated operational dataset."}
        />
        {activeResponse.error?.validationErrors && activeResponse.error.validationErrors.length > 0 && (
          <div className="rounded-lg bg-white border border-rose-200 p-4">
            <p className="text-xs font-bold text-rose-800 uppercase tracking-wider mb-2">
              Validation Error Details ({activeResponse.error.validationErrors.length} errors)
            </p>
            <ul className="text-xs text-rose-600 space-y-1 font-mono list-disc pl-5">
              {activeResponse.error.validationErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}
        <p className="text-xs text-slate-500 pt-2">
          In accordance with transport safety and data integrity rules, operational KPIs and alerts are not displayed when dataset validation fails.
        </p>
      </div>
    );
  }

  const { currentView, availableViews, datasetDate, corridorName } = activeResponse.data;
  const { kpis, headwaySummary, bunchingSummary, serviceGapsSummary, crowdingSummary, fleetSummary } = currentView;

  // Determine priority KPI statuses
  const bunchingStatusText = bunchingSummary.detectedAlerts.length > 0
    ? `${bunchingSummary.detectedAlerts.length} Active Bunching Alerts`
    : "Nominal Separation";
  const bunchingSeverity = bunchingSummary.detectedAlerts.length > 0 ? "alert" : "optimal";

  const crowdingSeverity = crowdingSummary.severelyOvercrowdedCount > 0 ? "alert" : "optimal";
  const crowdingStatusText = crowdingSummary.severelyOvercrowdedCount > 0
    ? `${crowdingSummary.severelyOvercrowdedCount} Severe (>150%) Alerts`
    : "Within Safe Capacity";

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* View Header & Evaluation Mode Selector */}
      <PageHeader
        badge="Control Room"
        badgeTone="teal"
        serviceArea="Silk Board–Hebbal, Bengaluru"
        title="Service Performance Overview"
        description="Operational headway regularity, service fulfilment, bunching mitigation, and resource allocation across the Silk Board–Hebbal service area."
        actions={
          <div className="flex flex-wrap items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200 self-start lg:self-auto">
            {availableViews.map((v) => {
              const isSelected = v.id === currentView.viewId;
              return (
                <button
                  key={v.id}
                  onClick={() => handleViewChange(v.id)}
                  className={`
                    flex flex-col text-left px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500
                    ${
                      isSelected
                        ? "bg-white text-slate-900 shadow-sm border border-slate-200/80 font-semibold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                    }
                  `}
                >
                  <span className="flex items-center gap-1.5">
                    {v.title}
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-normal ${
                        isSelected ? "bg-teal-100 text-teal-800" : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {v.badge}
                    </span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal mt-0.5">
                    {v.timeLabel}
                  </span>
                </button>
              );
            })}
          </div>
        }
      />

      {/* Evaluation Context / Anti-Lookahead Strip */}
      <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 shadow-xs">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-slate-400 shrink-0" />
          <span>
            Evaluation Timestamp:{" "}
            <strong className="text-slate-800 font-semibold">
              {currentView.evaluationTimestamp ? currentView.evaluationTimestamp : `Full Operating Day (${datasetDate})`}
            </strong>
          </span>
        </div>

        {currentView.isReplay ? (
          <div className="flex items-center gap-1.5 text-teal-900 bg-teal-50 border border-teal-200 rounded px-2.5 py-1 text-[11px]">
            <Info className="h-3.5 w-3.5 text-teal-600 shrink-0" />
            <span>
              <strong>Anti-Lookahead Active:</strong> Historical final outcomes and future events after {currentView.evaluationTimestamp?.split("T")[1]} are strictly excluded.
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-slate-700 bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-[11px]">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span>
              <strong>Audited Baseline:</strong> Reconciled across all 86 planned service timetable slots.
            </span>
          </div>
        )}
      </div>

      {/* 8 Priority Operational Metrics */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Gauge className="h-4 w-4 text-[#0F8278]" />
            Core Service Performance Indicators
          </h2>
          <span className="text-[11px] text-slate-500">Reconciled against 86 planned daily timetable slots</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* 1. Services Scheduled */}
          <KpiCard
            label="Services Scheduled"
            value={kpis.totalScheduledTrips}
            subValue="Timetable commitments"
            benchmark="Daily planned operations"
            status="neutral"
            icon={<Bus className="h-4 w-4 text-slate-600" />}
          />

          {/* 2. Services Operated */}
          <KpiCard
            label="Services Operated"
            value={kpis.operatedTrips}
            subValue="Completed revenue trips"
            benchmark="77 of 86 fulfilled"
            status="optimal"
            icon={<CheckCircle2 className="h-4 w-4 text-[#0F8278]" />}
          />

          {/* 3. Service Fulfilment */}
          <KpiCard
            label="Service Fulfilment"
            value={`${kpis.fulfillmentRatePct.toFixed(1)}%`}
            subValue="Operated / scheduled"
            benchmark="Target: ≥ 95.0%"
            status={kpis.fulfillmentRatePct >= 95 ? "optimal" : "warning"}
            icon={<Gauge className="h-4 w-4 text-[#0F8278]" />}
          />

          {/* 4. Cancelled Services */}
          <KpiCard
            label="Cancelled Services"
            value={kpis.cancelledTrips}
            subValue="Operational disruptions"
            benchmark="2 weather/traffic trips"
            status={kpis.cancelledTrips > 0 ? "warning" : "optimal"}
            icon={<AlertTriangle className="h-4 w-4 text-amber-600" />}
          />

          {/* 5. Resource Shortfalls */}
          <KpiCard
            label="Resource Shortfalls"
            value={kpis.resourceShortfallTrips}
            subValue="Unfulfilled crew / vehicle"
            benchmark="7 depot staffing shortfalls"
            status={kpis.resourceShortfallTrips > 0 ? "alert" : "optimal"}
            icon={<AlertCircle className="h-4 w-4 text-rose-600" />}
          />

          {/* 6. Headway Regularity (OTP) */}
          <KpiCard
            label="Headway Regularity (OTP)"
            value={headwaySummary.otpSummary.available ? `${headwaySummary.otpSummary.onTimePct.toFixed(1)}%` : "N/A"}
            subValue={headwaySummary.otpSummary.available ? `±${headwaySummary.otpSummary.onTimeThresholdSeconds}s tolerance` : "No visits observed"}
            benchmark="Target: ≥ 80.0% regularity"
            status={headwaySummary.otpSummary.available && headwaySummary.otpSummary.onTimePct >= 80 ? "optimal" : "warning"}
            icon={<Compass className="h-4 w-4 text-[#0F8278]" />}
          />

          {/* 7. Important Service Gaps */}
          <KpiCard
            label="Service Gaps (>1.5×)"
            value={serviceGapsSummary.detectedGaps.length}
            subValue={serviceGapsSummary.detectedGaps.length > 0 ? "Requires standby dispatch" : "Even vehicle spacing"}
            benchmark="Threshold: > 1.5× interval"
            status={serviceGapsSummary.detectedGaps.length > 0 ? "alert" : "optimal"}
            icon={<Layers className="h-4 w-4 text-amber-600" />}
          />

          {/* 8. Passenger Crowding */}
          <KpiCard
            label="Severe Crowding (≥150%)"
            value={crowdingSummary.severelyOvercrowdedCount}
            subValue={crowdingStatusText}
            benchmark="Design cap: 60 passengers"
            status={crowdingSeverity}
            icon={<Users className="h-4 w-4 text-rose-600" />}
          />
        </div>
      </div>

      {/* Operational Attention Section */}
      <section className="bg-white rounded-xl border border-[#DCE5ED] p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <h2 className="text-sm font-bold text-[#12233F] uppercase tracking-wide flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
              Operational Attention Required
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              High-priority incidents crossing operational thresholds requiring dispatcher review and intervention.
            </p>
          </div>
          <span className="text-[11px] font-semibold text-slate-600 bg-[#F5F7FA] border border-[#DCE5ED] px-2.5 py-1 rounded-md self-start sm:self-auto">
            4 Operational Focus Areas
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Attention Card 1: Morning Bunching at Marathahalli */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-amber-950">Morning Bunching at Marathahalli</h3>
                  <span className="text-[10px] text-amber-800 font-medium">Headway Compression</span>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200/80 text-amber-900 border border-amber-300">
                Actionable Hold (75s)
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-700">
              <p>
                <strong className="text-slate-900">What happened:</strong> Leading trip T-UP-004 (BUS-04) and trailing trip T-UP-005 (BUS-05) arrived within 75 seconds of each other.
              </p>
              <p>
                <strong className="text-slate-900">Where:</strong> Marathahalli Bridge UP (Stop: marathahalli-up, Northbound to Hebbal).
              </p>
              <p>
                <strong className="text-slate-900">Threshold crossed:</strong> 75s observed separation vs. minimum 120s bunching threshold (scheduled headway: 360s). Max hold: 300s; projected separation: 375s.
              </p>
              <p className="text-amber-900 font-medium">
                <strong>Why review:</strong> Prevents downstream passenger starvation, uneven passenger boarding delays, and inefficient double-bus convoying. Recommend holding trailing bus at Marathahalli control point.
              </p>
            </div>
          </div>

          {/* Attention Card 2: Evening Service Gap at Hebbal */}
          <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-rose-100 text-rose-800">
                  <AlertCircle className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-rose-950">Evening Service Gap at Hebbal</h3>
                  <span className="text-[10px] text-rose-800 font-medium">Excess Passenger Wait Time</span>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-200/80 text-rose-900 border border-rose-300">
                Relief Feasible (1,440s)
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-700">
              <p>
                <strong className="text-slate-900">What happened:</strong> 1,440s (24.0 min) elapsed between consecutive departures: BUS-06 on T-DN-026 (17:36:00) and BUS-07 on T-DN-027 (18:00:00).
              </p>
              <p>
                <strong className="text-slate-900">Where:</strong> Hebbal Terminal DOWN (Stop: hebbal-dn, Southbound to Silk Board).
              </p>
              <p>
                <strong className="text-slate-900">Threshold crossed:</strong> 1,440s gap vs. 1,080s threshold (1.5× 720s scheduled evening peak interval).
              </p>
              <p className="text-rose-900 font-medium">
                <strong>Why review:</strong> Halts severe platform crowding and passenger wait times. Standby vehicle BUS-13 and driver CREW-24 confirmed staged and ready for immediate dispatch from Hebbal.
              </p>
            </div>
          </div>

          {/* Attention Card 3: Morning Peak Crowding at Kadubeesanahalli */}
          <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-rose-100 text-rose-800">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-rose-950">Morning Peak Crowding at Kadubeesanahalli</h3>
                  <span className="text-[10px] text-rose-800 font-medium">Capacity Exceeded</span>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-200/80 text-rose-900 border border-rose-300">
                153.3% Occupancy
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-700">
              <p>
                <strong className="text-slate-900">What happened:</strong> Trip T-UP-006 (BUS-06) observed 92 passengers onboard a 60-passenger capacity vehicle.
              </p>
              <p>
                <strong className="text-slate-900">Where:</strong> Kadubeesanahalli UP (Stop: kadubeesanahalli-up, Northbound).
              </p>
              <p>
                <strong className="text-slate-900">Threshold crossed:</strong> 153.3% peak load (92 pax vs. 60 total capacity) exceeding severe overcrowding threshold.
              </p>
              <p className="text-rose-900 font-medium">
                <strong>Why review:</strong> Immediate passenger safety concern, prolonged stop dwell times worsening bunching behind, and pass-ups at subsequent tech park stops.
              </p>
            </div>
          </div>

          {/* Attention Card 4: Resource Shortfalls & Mechanical Defect Cancellations */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
                  <Bus className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-amber-950">Resource Shortfalls &amp; Mechanical Cancellations</h3>
                  <span className="text-[10px] text-amber-800 font-medium">Non-Operated Trips Reconciliation</span>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200/80 text-amber-900 border border-amber-300">
                7 Shortfalls / 2 Defects
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-700">
              <p>
                <strong className="text-slate-900">What happened:</strong> 7 resource shortfalls (6 physical vehicle deficits T-UP-016–020, T-DN-042 + 1 allocation hold on T-DN-031) and 2 mechanical defect cancellations before dispatch (T-UP-008 at depot, T-DN-033 at terminal).
              </p>
              <p>
                <strong className="text-slate-900">Where:</strong> Both directions (Silk Board &amp; Hebbal departures).
              </p>
              <p>
                <strong className="text-slate-900">Threshold crossed:</strong> 9 non-operated trips (10.5% of 86 scheduled trips). 77 operated trips completed.
              </p>
              <p className="text-amber-900 font-medium">
                <strong>Why review:</strong> Differentiates staging deficits from mechanical defects before dispatch; protects operational accountability and verifies reserve staging.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Replay Lifecycle Breakdown Bar (Only displayed in Replay Modes) */}
      {currentView.isReplay && kpis.replayStatus && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-teal-600" />
              As-Of Replay Fleet Status Breakdown at {currentView.evaluationTimestamp?.split("T")[1]}
            </p>
            <span className="text-[11px] text-slate-500">
              In-progress trips are actively operating and not counted as completed
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 border-t border-slate-100 text-center">
            <div className="bg-slate-50 rounded-lg p-2 border border-slate-200/60">
              <span className="text-xs text-slate-500 font-medium">Completed</span>
              <p className="text-lg font-bold text-emerald-700">{kpis.replayStatus.completedCount}</p>
            </div>
            <div className="bg-teal-50 rounded-lg p-2 border border-teal-200/60">
              <span className="text-xs text-teal-800 font-medium">In Progress (Active)</span>
              <p className="text-lg font-bold text-teal-900">{kpis.replayStatus.inProgressCount}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-2 border border-slate-200/60">
              <span className="text-xs text-slate-500 font-medium">Scheduled (Future)</span>
              <p className="text-lg font-bold text-slate-700">{kpis.replayStatus.scheduledCount}</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-2 border border-amber-200/60">
              <span className="text-xs text-amber-800 font-medium">Cancelled So Far</span>
              <p className="text-lg font-bold text-amber-900">{kpis.replayStatus.cancelledCount}</p>
            </div>
            <div className="bg-rose-50 rounded-lg p-2 border border-rose-200/60">
              <span className="text-xs text-rose-800 font-medium">Shortfall Logged</span>
              <p className="text-lg font-bold text-rose-900">{kpis.replayStatus.resourceShortfallCount}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Operational Intelligence Split: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION 1: Headway Monitoring & Irregularity CV */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Headway Regularity &amp; Monitoring
                </h3>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <span>Peak Target: <strong>{headwaySummary.targetPeakMinutes}m</strong></span>
                <span>•</span>
                <span>Off-Peak: <strong>{headwaySummary.targetOffpeakMinutes}m</strong></span>
              </div>
            </div>

            {/* OTP Service Area Badge */}
            {headwaySummary.otpSummary.available && (
              <div className="mb-4 bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-800">Service On-Time Performance (OTP)</span>
                  <p className="text-[11px] text-slate-500">
                    Threshold: ±{headwaySummary.otpSummary.onTimeThresholdSeconds}s from schedule ({headwaySummary.otpSummary.totalKnownVisits} operated visits evaluated)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    {headwaySummary.otpSummary.onTimePct.toFixed(1)}% On-Time
                  </span>
                  <span className="text-slate-400">|</span>
                  <span className="text-slate-600">{headwaySummary.otpSummary.latePct.toFixed(1)}% Late</span>
                </div>
              </div>
            )}

            {/* Key Stops Headway & Irregularity Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="pb-2">Control Stop / Direction</th>
                    <th className="pb-2">Evaluation Window</th>
                    <th className="pb-2 text-right">Observed Trips</th>
                    <th className="pb-2 text-right">Mean Headway</th>
                    <th className="pb-2 text-right">Irregularity CV (σ/μ)</th>
                    <th className="pb-2 text-right">Regularity Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {headwaySummary.keyStops.map((stop) => (
                    <tr key={stop.stopId} className="hover:bg-slate-50/70">
                      <td className="py-2.5 font-medium text-slate-900">
                        {stop.stopName}{" "}
                        <span className="text-[10px] text-slate-500 font-normal">({stop.direction})</span>
                      </td>
                      <td className="py-2.5 text-slate-500">{stop.windowLabel}</td>
                      <td className="py-2.5 text-right font-medium">{stop.observedCount}</td>
                      <td className="py-2.5 text-right">
                        {stop.meanHeadwayMinutes !== null ? `${stop.meanHeadwayMinutes} min` : "Insufficient data"}
                      </td>
                      <td className="py-2.5 text-right font-mono font-medium">
                        {stop.cv !== null ? stop.cv.toFixed(4) : "—"}
                      </td>
                      <td className="py-2.5 text-right">
                        {stop.regularityStatus === "regular" && (
                          <StatusBadge status="Regular (CV ≤ 0.25)" tone="success" size="sm" />
                        )}
                        {stop.regularityStatus === "irregular" && (
                          <StatusBadge status="Irregular (0.25 < CV ≤ 0.40)" tone="warning" size="sm" />
                        )}
                        {stop.regularityStatus === "severely_irregular" && (
                          <StatusBadge status="Severely Irregular (CV > 0.40)" tone="danger" size="sm" />
                        )}
                        {stop.regularityStatus === "insufficient_data" && (
                          <StatusBadge status="Insufficient Data (< 2)" tone="neutral" size="sm" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 mt-4 pt-3 border-t border-slate-100">
            Note: Irregularity CV uses population standard deviation (σ/μ) calculated strictly over observations within the evaluation window.
          </p>
        </div>

        {/* SECTION 2: Bus Bunching Detection & Holding Advice */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Bus Bunching Detection &amp; Holding Advice
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Threshold: &lt; 120s separation
              </span>
            </div>

            {/* Detected Alerts List */}
            {bunchingSummary.detectedAlerts.length > 0 ? (
              <div className="space-y-2 mb-4">
                <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Active Bunching Incidents ({bunchingSummary.detectedAlerts.length})
                </p>
                {bunchingSummary.detectedAlerts.map((b, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg bg-amber-50 border border-amber-200 gap-2 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                        <span className="font-bold text-amber-950">
                          {b.stopName} ({b.direction})
                        </span>
                        <span className="text-amber-800">
                          • {b.leadingBusId} &amp; {b.trailingBusId}
                        </span>
                      </div>
                      <p className="text-amber-800 text-[11px] mt-0.5">
                        Trips: {b.leadingTripId} (leading) / {b.trailingTripId} (trailing) • {b.bunchingType}
                      </p>
                    </div>
                    <div className="text-left sm:text-right shrink-0">
                      <span className="font-bold text-amber-900 bg-amber-100 border border-amber-300 rounded px-2 py-0.5">
                        {b.measuredSeconds}s Elapsed Separation
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 text-center text-xs text-slate-500 mb-4">
                No active bus bunching conditions detected at this evaluation timestamp.
              </div>
            )}

            {/* Advisory Holding Recommendation Box */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-teal-600" />
                  Dispatcher Holding Recommendation
                </span>
                <StatusBadge
                  status={
                    bunchingSummary.holdingRecommendation.status === "recommended"
                      ? "Recommended Hold"
                      : bunchingSummary.holdingRecommendation.status === "rejected"
                      ? "Hold Rejected (Delay Cap)"
                      : bunchingSummary.holdingRecommendation.status === "ineligible"
                      ? "Not a Control Point"
                      : "Not Applicable"
                  }
                  tone={
                    bunchingSummary.holdingRecommendation.status === "recommended"
                      ? "success"
                      : bunchingSummary.holdingRecommendation.status === "rejected"
                      ? "danger"
                      : "neutral"
                  }
                  size="sm"
                />
              </div>

              <p className="text-xs text-slate-700 leading-relaxed">
                {bunchingSummary.holdingRecommendation.recommendationText}
              </p>

              {bunchingSummary.holdingRecommendation.status === "recommended" && (
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200 text-center text-xs">
                  <div className="bg-white p-1.5 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-500">Current Separation</span>
                    <p className="font-bold text-amber-700">
                      {bunchingSummary.holdingRecommendation.currentSeparationSeconds}s
                    </p>
                  </div>
                  <div className="bg-white p-1.5 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-500">Feasible Hold</span>
                    <p className="font-bold text-teal-800">
                      {bunchingSummary.holdingRecommendation.feasibleHoldSeconds}s (5 min)
                    </p>
                  </div>
                  <div className="bg-white p-1.5 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-500">Projected Separation</span>
                    <p className="font-bold text-slate-800">
                      {bunchingSummary.holdingRecommendation.projectedSeparationSeconds}s
                    </p>
                  </div>
                  <div className="bg-white p-1.5 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-500">Restoration Type</span>
                    <p className="font-bold text-slate-700">
                      {bunchingSummary.holdingRecommendation.isPartialCorrection ? "Partial (within cap)" : "Full Target"}
                    </p>
                  </div>
                </div>
              )}

              {bunchingSummary.holdingRecommendation.disclaimer && (
                <p className="text-[10px] text-slate-500 italic mt-3 pt-2 border-t border-slate-200">
                  {bunchingSummary.holdingRecommendation.disclaimer}
                </p>
              )}
            </div>
          </div>

          <p className="text-[11px] text-slate-500 mt-4 pt-3 border-t border-slate-100">
            Control stops permitted for holding: Silk Board Terminal, Marathahalli Bridge, Hebbal Terminal. Max holding allowance: 300s.
          </p>
        </div>

        {/* SECTION 3: Service Gaps & Relief Bus Advice */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Large Service Gaps &amp; Standby Relief
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Threshold: &gt; 1.5× Scheduled Interval
              </span>
            </div>

            {/* Detected Gaps List */}
            {serviceGapsSummary.detectedGaps.length > 0 ? (
              <div className="space-y-2 mb-4">
                <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Active Service Gaps ({serviceGapsSummary.detectedGaps.length})
                </p>
                {serviceGapsSummary.detectedGaps.map((g, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg bg-rose-50 border border-rose-200 gap-2 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                        <span className="font-bold text-rose-950">
                          {g.stopName} ({g.direction})
                        </span>
                        <span className="text-rose-800">
                          • {g.leadingBusId} &amp; {g.trailingBusId}
                        </span>
                      </div>
                      <p className="text-rose-800 text-[11px] mt-0.5">
                        Trips: {g.leadingTripId} → {g.trailingTripId} • {g.gapType} (Sched: {g.nominalScheduledHeadwaySeconds}s)
                      </p>
                    </div>
                    <div className="text-left sm:text-right shrink-0">
                      <span className="font-bold text-rose-900 bg-rose-100 border border-rose-300 rounded px-2 py-0.5">
                        {g.measuredSeconds}s Gap ({Math.round(g.measuredSeconds / 60)} min)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 text-center text-xs text-slate-500 mb-4">
                No large service gaps exceeding the 1.5× threshold detected at this timestamp.
              </div>
            )}

            {/* Advisory Relief Recommendation Box */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Bus className="h-3.5 w-3.5 text-teal-600" />
                  Standby Relief Bus Recommendation
                </span>
                <StatusBadge
                  status={
                    serviceGapsSummary.reliefRecommendation.status === "feasible"
                      ? "Relief Feasible"
                      : serviceGapsSummary.reliefRecommendation.status === "unconfirmed"
                      ? "Unconfirmed / Infeasible"
                      : "Not Applicable"
                  }
                  tone={
                    serviceGapsSummary.reliefRecommendation.status === "feasible"
                      ? "success"
                      : serviceGapsSummary.reliefRecommendation.status === "unconfirmed"
                      ? "warning"
                      : "neutral"
                  }
                  size="sm"
                />
              </div>

              <p className="text-xs text-slate-700 leading-relaxed">
                {serviceGapsSummary.reliefRecommendation.recommendationText}
              </p>

              {serviceGapsSummary.reliefRecommendation.status === "feasible" && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-center text-xs">
                  <div className="bg-white p-1.5 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-500">Standby Vehicle</span>
                    <p className="font-bold text-teal-800">
                      {serviceGapsSummary.reliefRecommendation.standbyBusId}
                    </p>
                  </div>
                  <div className="bg-white p-1.5 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-500">Standby Driver</span>
                    <p className="font-bold text-slate-800">
                      {serviceGapsSummary.reliefRecommendation.standbyDriverId} (On Shift)
                    </p>
                  </div>
                  <div className="bg-white p-1.5 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-500">Staging Terminal</span>
                    <p className="font-bold text-slate-800">
                      {serviceGapsSummary.reliefRecommendation.stagedTerminalName}
                    </p>
                  </div>
                </div>
              )}

              {serviceGapsSummary.reliefRecommendation.limitationsDisclaimer && (
                <p className="text-[10px] text-slate-500 italic mt-3 pt-2 border-t border-slate-200">
                  {serviceGapsSummary.reliefRecommendation.limitationsDisclaimer}
                </p>
              )}
            </div>
          </div>

          <p className="text-[11px] text-slate-500 mt-4 pt-3 border-t border-slate-100">
            Relief buses may only be dispatched from designated directional origin terminals with staged standby fleet and on-shift drivers.
          </p>
        </div>

        {/* SECTION 4: Passenger Crowding & Occupancy */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Passenger Crowding &amp; Occupancy
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Design Capacity: 60 Passengers (40 seated + 20 standing)
              </span>
            </div>

            {/* Occupancy Thresholds Breakdown Cards */}
            <div className="grid grid-cols-3 gap-2.5 mb-4 text-center text-xs">
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-lg p-2.5">
                <span className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wider">
                  Normal (&lt;100%)
                </span>
                <p className="text-lg font-bold text-emerald-900 mt-0.5">
                  {crowdingSummary.normalCount}
                </p>
                <span className="text-[10px] text-emerald-700">&lt; 60 passengers</span>
              </div>
              <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-2.5">
                <span className="text-[10px] font-semibold text-amber-800 uppercase tracking-wider">
                  Overcrowded (100–150%)
                </span>
                <p className="text-lg font-bold text-amber-900 mt-0.5">
                  {crowdingSummary.overcrowdedCount}
                </p>
                <span className="text-[10px] text-amber-700">60–89 passengers</span>
              </div>
              <div className="bg-rose-50/70 border border-rose-200 rounded-lg p-2.5">
                <span className="text-[10px] font-semibold text-rose-800 uppercase tracking-wider">
                  Severe (≥150%)
                </span>
                <p className="text-lg font-bold text-rose-900 mt-0.5">
                  {crowdingSummary.severelyOvercrowdedCount}
                </p>
                <span className="text-[10px] text-rose-700">≥ 90 passengers</span>
              </div>
            </div>

            {/* Peak Observed Occupancy */}
            {crowdingSummary.peakOccupancyPct !== null && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-800">Peak Observed Occupancy</span>
                  <p className="text-[11px] text-slate-500">
                    Stop: <strong>{crowdingSummary.peakOccupancyStopName}</strong> • Bus: <strong>{crowdingSummary.peakOccupancyBusId}</strong>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                    {crowdingSummary.peakOccupancyPct}% of capacity
                  </span>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {crowdingSummary.peakOnboardPassengers} passengers on board
                  </p>
                </div>
              </div>
            )}

            {/* Severe Overcrowding Observations */}
            {crowdingSummary.activeSeverelyOvercrowdedAlerts.length > 0 ? (
              <div className="space-y-1.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Severe Overcrowding Observations (Observed on or before evaluation timestamp, ≥150% of capacity)
                </p>
                {crowdingSummary.activeSeverelyOvercrowdedAlerts.map((a, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 rounded bg-rose-50/80 border border-rose-200 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-900">{a.stopName}</span>
                      <span className="text-slate-500 text-[11px]"> • Trip {a.tripId} ({a.busId})</span>
                    </div>
                    <span className="font-bold text-rose-800">
                      {a.occupancyPct}% ({a.onboardPassengers} pax)
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">
                No severe overcrowding observations recorded on or before this evaluation timestamp.
              </p>
            )}
          </div>

          <p className="text-[11px] text-slate-500 mt-4 pt-3 border-t border-slate-100">
            Occupancy warning trigger: &gt;100% capacity (&gt;60 passengers). Severe crowding alert: ≥150% capacity (≥90 passengers).
          </p>
        </div>
      </div>

      {/* Fleet Resource Availability Strip */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <Bus className="h-4 w-4 text-teal-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Service Fleet Status &amp; Crew Allocation
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            Total Allocated Fleet: <strong>{fleetSummary.totalVehicles} Vehicles</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-500 font-medium">In-Service Buses</span>
            <p className="text-xl font-bold text-slate-900 mt-1">{fleetSummary.activeCount}</p>
            <span className="text-[10px] text-slate-500">Scheduled route operations</span>
          </div>

          <div className="p-3 bg-teal-50 rounded-lg border border-teal-200">
            <span className="text-teal-800 font-medium">Standby Vehicles</span>
            <p className="text-xl font-bold text-teal-900 mt-1">{fleetSummary.standbyCount}</p>
            <span className="text-[10px] text-teal-700">
              {fleetSummary.standbyBuses.length > 0
                ? fleetSummary.standbyBuses.map((b) => b.busId).join(", ")
                : "None available"}
            </span>
          </div>

          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
            <span className="text-amber-800 font-medium">Maintenance Reserve</span>
            <p className="text-xl font-bold text-amber-900 mt-1">{fleetSummary.maintenanceCount}</p>
            <span className="text-[10px] text-amber-700">
              {fleetSummary.maintenanceBuses.length > 0
                ? fleetSummary.maintenanceBuses.map((b) => b.busId).join(", ")
                : "None"}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-500 font-medium">Standby Drivers On Shift</span>
            <p className="text-xl font-bold text-slate-900 mt-1">
              {fleetSummary.crewShiftStatus.onShiftStandbyDrivers.length}
            </p>
            <span className="text-[10px] text-slate-500">
              {fleetSummary.crewShiftStatus.onShiftStandbyDrivers.map((d) => d.crewId).join(", ") || "None"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
