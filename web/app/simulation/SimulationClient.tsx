"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Bus,
  Users,
  History,
  X,
  FileSpreadsheet
} from "lucide-react";
import {
  simulateHoldingScenario,
  simulateStandbyReliefScenario,
  simulateCrowdingScenario,
  type HoldingSimulationResult,
  type StandbyReliefResult,
  type CrowdingScenarioResult
} from "@/lib/engine/simulation-logic";
import type { SimulationBaselineData } from "@/lib/engine/simulation-service";

import PageHeader from "@/app/components/ui/PageHeader";
import AlertPanel from "@/app/components/ui/AlertPanel";
import Button from "@/app/components/ui/Button";

interface SimulationClientProps {
  initialData: SimulationBaselineData;
}

interface StoredSimRun {
  id: string;
  scenarioType: "holding" | "relief" | "crowding";
  summary: string;
  details: string;
  simulatedAt: string;
}

const STORAGE_KEY = "hogana_simulation_history_v1";

function loadStoredSimRuns(): { runs: StoredSimRun[]; isStorageAvailable: boolean } {
  if (typeof window === "undefined") return { runs: [], isStorageAvailable: true };
  try {
    const testKey = "__hogana_sim_probe__";
    localStorage.setItem(testKey, "1");
    localStorage.removeItem(testKey);

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { runs: [], isStorageAvailable: true };

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return { runs: [], isStorageAvailable: true };

    const valid: StoredSimRun[] = [];
    for (const item of parsed) {
      if (
        item &&
        typeof item === "object" &&
        typeof (item as StoredSimRun).id === "string" &&
        ((item as StoredSimRun).scenarioType === "holding" ||
          (item as StoredSimRun).scenarioType === "relief" ||
          (item as StoredSimRun).scenarioType === "crowding") &&
        typeof (item as StoredSimRun).summary === "string" &&
        typeof (item as StoredSimRun).details === "string" &&
        typeof (item as StoredSimRun).simulatedAt === "string"
      ) {
        valid.push(item as StoredSimRun);
      }
    }
    return { runs: valid, isStorageAvailable: true };
  } catch (err) {
    console.warn("Unable to access localStorage for simulation history:", err);
    return { runs: [], isStorageAvailable: false };
  }
}

function saveStoredSimRuns(runs: StoredSimRun[]): boolean {
  if (typeof window === "undefined") return false;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(runs));
    return true;
  } catch (err) {
    console.warn("Unable to save simulation runs to localStorage:", err);
    return false;
  }
}

export default function SimulationClient({ initialData }: SimulationClientProps) {
  const [activeTab, setActiveTab] = useState<"holding" | "relief" | "crowding" | "comparison">("holding");

  // Scenario 1: Holding inputs
  const [holdInput, setHoldInput] = useState<number>(initialData.holding.maxHoldingAllowanceSeconds);

  // Scenario 2: Relief inputs
  const [selectedBusId, setSelectedBusId] = useState<string>(initialData.relief.defaultBusId);
  const [selectedDriverId, setSelectedDriverId] = useState<string>(initialData.relief.defaultDriverId);

  // History & Toast
  const [history, setHistory] = useState<StoredSimRun[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "warning" } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const { runs, isStorageAvailable } = loadStoredSimRuns();
      setHistory(runs);
      if (!isStorageAvailable) {
        setNotification({
          message: "Warning: Browser local storage is unavailable. Simulation runs will persist in memory only.",
          type: "warning"
        });
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const showNotification = (message: string, type: "success" | "warning" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Run data-backed simulation calculations (pure & deterministic)
  const holdingResult: HoldingSimulationResult = useMemo(() => {
    return simulateHoldingScenario({ holdDurationSeconds: holdInput }, initialData.holding);
  }, [holdInput, initialData.holding]);

  const reliefResult: StandbyReliefResult = useMemo(() => {
    return simulateStandbyReliefScenario(
      {
        standbyBusId: selectedBusId,
        standbyDriverId: selectedDriverId
      },
      initialData.relief
    );
  }, [selectedBusId, selectedDriverId, initialData.relief]);

  const crowdingResult: CrowdingScenarioResult = useMemo(() => {
    return simulateCrowdingScenario(initialData.crowding);
  }, [initialData.crowding]);

  const handleSaveHoldingRun = () => {
    const newRun: StoredSimRun = {
      id: `SIM-HOLD-${Date.now()}`,
      scenarioType: "holding",
      summary: `Holding ${holdingResult.holdDurationSeconds}s at ${initialData.holding.controlStopName}`,
      details: `Projected separation: ${holdingResult.projectedSeparationSeconds}s (${holdingResult.bunchingCleared ? "Cleared" : "Bunching persists"}, ${holdingResult.headwayRestorationPct}% headway)`,
      simulatedAt: new Date().toISOString()
    };
    const updated = [newRun, ...history.slice(0, 19)];
    setHistory(updated);
    const saved = saveStoredSimRuns(updated);
    if (saved) {
      showNotification("Holding simulation saved to demonstration history.", "success");
    } else {
      showNotification("Warning: Storage unavailable; run saved in memory only.", "warning");
    }
  };

  const handleSaveReliefRun = () => {
    const newRun: StoredSimRun = {
      id: `SIM-RELIEF-${Date.now()}`,
      scenarioType: "relief",
      summary: `Relief Deployment (${selectedBusId} + ${selectedDriverId})`,
      details: `Result: ${reliefResult.feasibilityStatus.toUpperCase()} — ${reliefResult.feasibilitySummary}`,
      simulatedAt: new Date().toISOString()
    };
    const updated = [newRun, ...history.slice(0, 19)];
    setHistory(updated);
    const saved = saveStoredSimRuns(updated);
    if (saved) {
      showNotification("Relief simulation saved to demonstration history.", "success");
    } else {
      showNotification("Warning: Storage unavailable; run saved in memory only.", "warning");
    }
  };

  const handleClearHistory = () => {
    if (confirm("Clear local simulation history?")) {
      setHistory([]);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {
        console.warn(e);
      }
      showNotification("Simulation history cleared.");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg border flex items-center gap-2 text-xs ${
            notification.type === "warning"
              ? "bg-amber-900/95 text-amber-100 border-amber-700"
              : "bg-slate-900 text-white border-slate-700"
          }`}
        >
          <CheckCircle2
            className={`h-4 w-4 shrink-0 ${
              notification.type === "warning" ? "text-amber-400" : "text-emerald-400"
            }`}
          />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header & Overview Card */}
      <PageHeader
        badge="Scenario Simulator"
        badgeTone="teal"
        corridor="Silk Board ↔ Hebbal (19.8 km)"
        title="Operational Intervention Sandbox &amp; Impact Analysis"
        description="Simulate operational adjustments across approved morning bunching, evening service gap, and passenger crowding scenarios. This deterministic model evaluates exact constraints without altering approved source dataset records."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsHistoryOpen(true)}
              leftIcon={<History className="h-3.5 w-3.5 text-slate-500" />}
            >
              Simulation History ({history.length})
            </Button>
          </div>
        }
      />

      {/* Deterministic Disclaimer Banner */}
      <AlertPanel
        severity="info"
        title="Deterministic Demonstration Model"
        description="Calculations evaluate approved mathematical constraints from demo_assumptions.json. This is not a black-box predictive AI system or live passenger forecast."
      />

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 p-2 shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: "holding", label: "Scenario 1: Bus Bunching Hold", icon: Clock },
            { id: "relief", label: "Scenario 2: Service Gap Relief", icon: Bus },
            { id: "crowding", label: "Scenario 3: Crowding & Frequency", icon: Users },
            { id: "comparison", label: "Multi-Scenario Matrix", icon: FileSpreadsheet }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`
                  flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all
                  ${
                    isActive
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
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

      {/* TAB 1: SCENARIO 1 — BUS BUNCHING & HOLDING */}
      {activeTab === "holding" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-4 border-b border-slate-100 mb-5">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-teal-600" />
                  Scenario 1: Bus Bunching &amp; Dispatcher Hold Simulation
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Evaluation Anchor: <strong>08:24:00 (Morning Peak)</strong> at <strong>Marathahalli UP</strong> between leading <strong>BUS-06</strong> and trailing <strong>BUS-07</strong>.
                </p>
              </div>

              <button
                onClick={handleSaveHoldingRun}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs"
              >
                <Play className="h-3.5 w-3.5" />
                <span>Save Simulation Run</span>
              </button>
            </div>

            {/* Interactive Slider & Presets */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-900 block">
                    Trailing Bus Holding Duration (H):
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Adjust hold applied to BUS-07 while dwelling at Marathahalli UP control point.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xl font-extrabold text-teal-700 bg-white border border-teal-200 rounded-lg px-3 py-1">
                    {holdInput}s
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    ({Math.round(holdInput / 60)} min {holdInput % 60}s)
                  </span>
                </div>
              </div>

              {/* Slider Control */}
              <input
                type="range"
                min="0"
                max="300"
                step="15"
                value={holdInput}
                onChange={(e) => setHoldInput(Number(e.target.value))}
                className="w-full accent-teal-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />

              {/* Preset Buttons */}
              <div className="flex flex-wrap items-center justify-between text-xs gap-2 pt-1">
                <span className="text-[11px] font-semibold text-slate-500">Quick Presets:</span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { label: "0s (No Hold)", val: 0 },
                    { label: "60s (1 min)", val: 60 },
                    { label: "150s (2.5 min)", val: 150 },
                    { label: "300s (Max Cap)", val: 300 }
                  ].map((p) => (
                    <button
                      key={p.val}
                      onClick={() => setHoldInput(p.val)}
                      className={`
                        px-2.5 py-1 rounded text-xs font-semibold border transition-all
                        ${
                          holdInput === p.val
                            ? "bg-teal-600 text-white border-teal-600"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                        }
                      `}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Outcomes Comparison Grid */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Baseline Separation
                </span>
                <span className="text-2xl font-mono font-bold text-slate-900 block">
                  {holdingResult.baselineSeparationSeconds}s
                </span>
                <span className="text-[10px] text-rose-600 font-semibold block">
                  &lt; 120s Bunching Alert Active
                </span>
              </div>

              <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/50 space-y-1">
                <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider block">
                  Holding Applied (H)
                </span>
                <span className="text-2xl font-mono font-bold text-teal-900 block">
                  +{holdingResult.holdDurationSeconds}s
                </span>
                <span className="text-[10px] text-teal-700 font-medium block">
                  Max allowance: {holdingResult.maxHoldingAllowanceSeconds}s
                </span>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Projected Separation
                </span>
                <span className="text-2xl font-mono font-bold text-slate-900 block">
                  {holdingResult.projectedSeparationSeconds}s
                </span>
                <span
                  className={`text-[10px] font-bold block ${
                    holdingResult.bunchingCleared ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {holdingResult.bunchingCleared
                    ? "✓ Clears 120s bunching threshold"
                    : "✗ Remains in bunching state (< 120s)"}
                </span>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Headway Restoration
                </span>
                <span className="text-2xl font-mono font-bold text-slate-900 block">
                  {holdingResult.headwayRestorationPct}%
                </span>
                <span className="text-[10px] text-slate-500 font-medium block">
                  Target headway: {holdingResult.targetHeadwaySeconds}s (12 min)
                </span>
              </div>
            </div>

            {/* Detailed Analysis Card */}
            <div className="mt-6 p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-2">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Deterministic Simulation Assessment
              </h3>
              <p className="text-slate-700 leading-relaxed">
                <strong>Status:</strong> {holdingResult.correctionStatusLabel}.
              </p>
              <p className="text-slate-600 leading-relaxed font-mono text-[11px]">
                {holdingResult.notes}
              </p>
              <div className="pt-2 border-t border-slate-200 text-slate-500 text-[11px] italic">
                <strong>Operational Constraint:</strong> {holdingResult.limitations}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SCENARIO 2 — LARGE GAP & STANDBY RELIEF */}
      {activeTab === "relief" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-4 border-b border-slate-100 mb-5">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Bus className="h-5 w-5 text-teal-600" />
                  Scenario 2: Terminal Service Gap &amp; Standby Relief Feasibility
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Evaluation Anchor: <strong>18:15:00 (Evening Peak)</strong> at <strong>Hebbal DOWN</strong> caused by cancelled trip <strong>T-DN-033</strong>.
                </p>
              </div>

              <button
                onClick={handleSaveReliefRun}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs"
              >
                <Play className="h-3.5 w-3.5" />
                <span>Save Simulation Run</span>
              </button>
            </div>

            {/* Standby Bus & Crew Selection Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-5 rounded-xl border border-slate-200 text-xs">
              <div>
                <label className="font-bold text-slate-900 block mb-1">
                  Select Standby Vehicle Candidate:
                </label>
                <select
                  value={selectedBusId}
                  onChange={(e) => setSelectedBusId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-teal-500"
                >
                  {initialData.relief.vehicles.map((v) => (
                    <option key={v.busId} value={v.busId}>
                      {v.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Candidate Location: {reliefResult.standbyBusLocation}
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-900 block mb-1">
                  Select Standby Driver Candidate:
                </label>
                <select
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-teal-500"
                >
                  {initialData.relief.drivers.map((d) => (
                    <option key={d.crewId} value={d.crewId}>
                      {d.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Duty Status: {reliefResult.driverShiftWindow}
                </p>
              </div>
            </div>

            {/* Feasibility Result Card */}
            <div
              className={`
                mt-6 p-5 rounded-xl border text-xs space-y-3 transition-all
                ${
                  reliefResult.feasibilityStatus === "feasible"
                    ? "bg-emerald-50/70 border-emerald-300"
                    : "bg-rose-50/70 border-rose-300"
                }
              `}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold uppercase tracking-wider text-xs flex items-center gap-1.5">
                  {reliefResult.feasibilityStatus === "feasible" ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span className="text-emerald-950">Resource Deployment Feasible</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 text-rose-600" />
                      <span className="text-rose-950">Resource Deployment Unconfirmed</span>
                    </>
                  )}
                </span>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white border border-slate-200">
                  Gap: {reliefResult.measuredGapSeconds}s / Threshold: {reliefResult.largeGapThresholdSeconds}s
                </span>
              </div>

              <p
                className={`font-medium ${
                  reliefResult.feasibilityStatus === "feasible" ? "text-emerald-900" : "text-rose-900"
                }`}
              >
                {reliefResult.feasibilitySummary}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-[11px]">
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-0.5">
                  <span className="text-slate-500 block">Terminal Staging Verification:</span>
                  <strong>
                    {reliefResult.busStagedAtTerminal
                      ? "✓ Bus is physically staged at Hebbal DOWN"
                      : "✗ Bus is not staged at departure terminal"}
                  </strong>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-0.5">
                  <span className="text-slate-500 block">Crew Shift Window Verification:</span>
                  <strong>
                    {reliefResult.driverOnShiftAtEvalTime
                      ? "✓ Driver is on active Shift 2 duty at 18:15:00"
                      : "✗ Driver is off-duty (outside shift window)"}
                  </strong>
                </div>
              </div>

              {/* Mandatory Realistic Disclaimer */}
              <div className="pt-2 border-t border-slate-200 text-slate-600 text-[11px] leading-relaxed italic">
                <strong>Demonstration Boundary Disclosure:</strong> {reliefResult.limitations}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SCENARIO 3 — CROWDING & FREQUENCY */}
      {activeTab === "crowding" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6">
            <div className="pb-4 border-b border-slate-100 mb-5">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="h-5 w-5 text-teal-600" />
                Scenario 3: Corridor Passenger Crowding &amp; Frequency Eligibility
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluates passenger load observations from <code>passenger_loads.csv</code> against corridor capacity thresholds.
              </p>
            </div>

            {/* Thresholds Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 text-xs">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                <span className="font-bold text-slate-500 uppercase tracking-wider block text-[11px]">
                  Vehicle Design Capacity
                </span>
                <span className="text-2xl font-mono font-bold text-slate-900 block">
                  {crowdingResult.designCapacity} Passengers
                </span>
                <span className="text-slate-500 text-[11px]">
                  {crowdingResult.seatedCapacity} Seated + {crowdingResult.standingCapacity} Standing
                </span>
              </div>

              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60 space-y-1">
                <span className="font-bold text-amber-800 uppercase tracking-wider block text-[11px]">
                  100% Warning Threshold
                </span>
                <span className="text-2xl font-mono font-bold text-amber-900 block">
                  60 Passengers
                </span>
                <span className="text-amber-800 text-[11px]">
                  {crowdingResult.overcrowdedVisits} corridor stop visits (60–89 pax)
                </span>
              </div>

              <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/60 space-y-1">
                <span className="font-bold text-rose-800 uppercase tracking-wider block text-[11px]">
                  150% Severe Threshold
                </span>
                <span className="text-2xl font-mono font-bold text-rose-900 block">
                  90 Passengers
                </span>
                <span className="text-rose-800 text-[11px]">
                  {crowdingResult.severelyOvercrowdedVisits} corridor stop visits (≥ 90 pax)
                </span>
              </div>
            </div>

            {/* Peak Occupancy Derivation */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-2 mb-6">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Approved Dataset Peak Occupancy Derivation
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700">
                <p>• <strong>Maximum Observed Load:</strong> {crowdingResult.observedPeakPassengers} passengers on board</p>
                <p>• <strong>Peak Occupancy Ratio:</strong> {crowdingResult.observedPeakPassengers} / 60 = <strong>{crowdingResult.observedPeakOccupancyPct}%</strong></p>
                <p>• <strong>Location:</strong> {crowdingResult.peakStopName}</p>
                <p>• <strong>Trip Identifier:</strong> {crowdingResult.peakTripId}</p>
              </div>
            </div>

            {/* Frequency Increase Policy Rule Evaluation */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-2">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Frequency Increase Policy Rule Evaluation
              </h3>
              <p className="text-slate-700 font-mono text-[11px]">
                {crowdingResult.frequencyIncreaseRule}
              </p>
              <div className="p-3 rounded-lg bg-white border border-slate-200 text-slate-800 font-medium">
                {crowdingResult.frequencyIncreaseReason}
              </div>
              <p className="text-slate-500 text-[11px] italic pt-1">
                {crowdingResult.limitations}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MULTI-SCENARIO MATRIX */}
      {activeTab === "comparison" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6">
          <div className="pb-4 border-b border-slate-100 mb-5">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-teal-600" />
              Multi-Scenario Comparative Impact Matrix
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Side-by-side comparison of baseline operational anomalies against evaluated intervention models.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-lg">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3">Scenario</th>
                  <th className="p-3">Baseline</th>
                  <th className="p-3">Intervention Input</th>
                  <th className="p-3">Deterministic Result</th>
                  <th className="p-3">Threshold Constraint</th>
                  <th className="p-3">Operational Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                <tr className="hover:bg-slate-50">
                  <td className="p-3 font-semibold text-slate-900">
                    Scenario 1: Bus Bunching Hold (Marathahalli UP)
                  </td>
                  <td className="p-3 font-mono">75s separation</td>
                  <td className="p-3 font-mono">Hold = {holdingResult.holdDurationSeconds}s</td>
                  <td className="p-3 font-mono font-bold text-teal-800">
                    {holdingResult.projectedSeparationSeconds}s separation ({holdingResult.headwayRestorationPct}% headway)
                  </td>
                  <td className="p-3 font-mono text-slate-600">&lt; 120s bunching / 720s target</td>
                  <td className="p-3">
                    <span
                      className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                        holdingResult.bunchingCleared
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {holdingResult.correctionStatusLabel}
                    </span>
                  </td>
                </tr>

                <tr className="hover:bg-slate-50">
                  <td className="p-3 font-semibold text-slate-900">
                    Scenario 2: Service Gap Standby Relief (Hebbal DOWN)
                  </td>
                  <td className="p-3 font-mono">1,440s departure gap</td>
                  <td className="p-3 font-mono">Deploy {selectedBusId} + {selectedDriverId}</td>
                  <td className="p-3 font-mono font-bold text-teal-800">
                    Resource validation complete
                  </td>
                  <td className="p-3 font-mono text-slate-600">&gt; 1,080s gap threshold</td>
                  <td className="p-3">
                    <span
                      className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                        reliefResult.feasibilityStatus === "feasible"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {reliefResult.feasibilityStatus.toUpperCase()}
                    </span>
                  </td>
                </tr>

                <tr className="hover:bg-slate-50">
                  <td className="p-3 font-semibold text-slate-900">
                    Scenario 3: Crowding &amp; Frequency Eligibility
                  </td>
                  <td className="p-3 font-mono">Peak 92 pax (153.3%)</td>
                  <td className="p-3 font-mono">Rule: ≥ 3 consecutive severe visits</td>
                  <td className="p-3 font-mono font-bold text-slate-800">
                    Max consecutive severe = 1
                  </td>
                  <td className="p-3 font-mono text-slate-600">≥ 90 pax (150% capacity)</td>
                  <td className="p-3">
                    <span className="font-semibold px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700">
                      NOT TRIGGERED
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* History Drawer */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-xs">
          <div className="bg-white h-full max-w-md w-full shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-teal-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Simulation History
                </h3>
              </div>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
                aria-label="Close drawer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-slate-500">
                Runs recorded in browser local demonstration storage (<code>localStorage</code>).
              </p>
              {history.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="text-xs text-rose-600 hover:text-rose-800 font-semibold"
                >
                  Clear All
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No scenario simulation runs recorded yet. Click &quot;Save Simulation Run&quot; to log outcomes.
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((h) => (
                  <div
                    key={h.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-900">{h.id}</span>
                      <span className="font-bold uppercase text-[10px] text-teal-800 bg-teal-100 px-1.5 py-0.5 rounded">
                        {h.scenarioType}
                      </span>
                    </div>
                    <p className="font-semibold text-slate-800">{h.summary}</p>
                    <p className="text-slate-600 font-mono text-[11px] bg-white p-2 rounded border border-slate-100">
                      {h.details}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Simulated: {new Date(h.simulatedAt).toLocaleTimeString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
