/**
 * HOGANA — Step 5: Deterministic Scenario Simulation Logic
 * 
 * Provides pure, deterministic scenario calculations for operational simulations.
 * Built strictly upon approved dataset baselines and Step 2 engine rules.
 * 
 * Invariants:
 * - Deterministic demonstration calculations only (NOT predictive AI).
 * - Sourced strictly from approved demonstration scenarios.
 * - Sourced from 60-passenger design capacity (40 seated + 20 standing).
 * - Leaves approved dataset strictly untouched.
 */

export interface HoldingSimulationInput {
  holdDurationSeconds: number; // 0 to 300
}

export interface HoldingSimulationResult {
  available: boolean;
  unavailableReason?: string;
  baselineSeparationSeconds: number | null;
  holdDurationSeconds: number;
  projectedSeparationSeconds: number | null;
  bunchingThresholdSeconds: number | null;
  targetHeadwaySeconds: number | null;
  maxHoldingAllowanceSeconds: number | null;
  bunchingCleared: boolean;
  correctionStatus: 'cleared_partial' | 'cleared_complete' | 'bunching_persists' | 'unavailable';
  correctionStatusLabel: string;
  headwayRestorationPct: number | null;
  exceedsHoldingAllowance: boolean;
  notes: string;
  limitations: string;
}

export interface StandbyReliefInput {
  standbyBusId: string;
  standbyDriverId: string;
}

export interface StandbyReliefResult {
  available: boolean;
  unavailableReason?: string;
  location: string;
  direction: 'DOWN';
  measuredGapSeconds: number | null;
  largeGapThresholdSeconds: number | null;
  cancelledTripId: string | null;
  standbyBusId: string | null;
  standbyBusLocation: string | null;
  busStagedAtTerminal: boolean;
  standbyDriverId: string | null;
  driverShiftWindow: string | null;
  driverOnShiftAtEvalTime: boolean;
  feasibilityStatus: 'feasible' | 'unconfirmed' | 'unavailable';
  feasibilitySummary: string;
  estimatedDispatchWindowMinutes: string;
  limitations: string;
}

export interface CrowdingScenarioResult {
  available: boolean;
  unavailableReason?: string;
  designCapacity: number | null;
  seatedCapacity: number | null;
  standingCapacity: number | null;
  warningThresholdPct: number;
  severeThresholdPct: number;
  observedPeakPassengers: number | null;
  observedPeakOccupancyPct: number | null;
  peakStopName: string | null;
  peakTripId: string | null;
  totalEvaluatedVisits: number | null;
  normalVisits: number | null;
  overcrowdedVisits: number | null;
  severelyOvercrowdedVisits: number | null;
  frequencyIncreaseRule: string;
  frequencyIncreaseEligible: boolean;
  frequencyIncreaseReason: string;
  limitations: string;
}

export interface HoldingBaselineParams {
  baselineSeparationSeconds?: number;
  bunchingThresholdSeconds?: number;
  targetHeadwaySeconds?: number;
  maxHoldingAllowanceSeconds?: number;
  controlStopName?: string;
  trailingBusId?: string;
}

export interface ReliefBaselineParams {
  measuredGapSeconds?: number;
  largeGapThresholdSeconds?: number;
  terminalName?: string;
  cancelledTripId?: string;
  vehicles?: Array<{ busId: string; status: string; location: string; isStagedAtHebbal: boolean }>;
  drivers?: Array<{ crewId: string; shiftHours: string; isOnShiftAt1815: boolean }>;
}

export interface CrowdingBaselineParams {
  designCapacity?: number;
  seatedCapacity?: number;
  standingCapacity?: number;
  observedPeakPassengers?: number;
  observedPeakOccupancyPct?: number;
  peakStopName?: string;
  peakTripId?: string;
  totalEvaluatedVisits?: number;
  normalVisits?: number;
  overcrowdedVisits?: number;
  severelyOvercrowdedVisits?: number;
  frequencyIncreaseRule?: string;
  frequencyIncreaseEligible?: boolean;
  frequencyIncreaseReason?: string;
}

/**
 * Simulate Holding Intervention on Morning Bunching Scenario
 * Evaluates trailing bus holding duration at control point (08:24:00).
 */
export function simulateHoldingScenario(
  input: HoldingSimulationInput,
  baseline?: HoldingBaselineParams
): HoldingSimulationResult {
  if (
    !baseline ||
    baseline.baselineSeparationSeconds === undefined ||
    baseline.bunchingThresholdSeconds === undefined ||
    baseline.targetHeadwaySeconds === undefined ||
    baseline.maxHoldingAllowanceSeconds === undefined
  ) {
    return {
      available: false,
      unavailableReason: 'Holding baseline parameters unavailable from operational engine.',
      baselineSeparationSeconds: null,
      holdDurationSeconds: input?.holdDurationSeconds ?? 0,
      projectedSeparationSeconds: null,
      bunchingThresholdSeconds: null,
      targetHeadwaySeconds: null,
      maxHoldingAllowanceSeconds: null,
      bunchingCleared: false,
      correctionStatus: 'unavailable',
      correctionStatusLabel: 'Simulation Baseline Unavailable',
      headwayRestorationPct: null,
      exceedsHoldingAllowance: false,
      notes: 'Cannot simulate holding: required bunching or headway metrics are missing from source data.',
      limitations: 'Simulation blocked: source observation missing.'
    };
  }

  const baseSep = baseline.baselineSeparationSeconds;
  const threshold = baseline.bunchingThresholdSeconds;
  const target = baseline.targetHeadwaySeconds;
  const maxAllowance = baseline.maxHoldingAllowanceSeconds;
  const busLabel = baseline.trailingBusId ?? 'Trailing Bus';
  const stopLabel = baseline.controlStopName ?? 'Control Point';

  // Clamp hold duration to [0, maxAllowance]
  const hold = Math.max(0, Math.min(maxAllowance, Math.round(input.holdDurationSeconds)));
  const projected = baseSep + hold;
  const bunchingCleared = projected >= threshold;

  let correctionStatus: HoldingSimulationResult['correctionStatus'] = 'bunching_persists';
  let correctionStatusLabel = `Bunching Persists (< ${threshold}s separation)`;

  if (projected >= target) {
    correctionStatus = 'cleared_complete';
    correctionStatusLabel = `Complete Headway Restoration (≥ ${target}s target)`;
  } else if (projected >= threshold) {
    correctionStatus = 'cleared_partial';
    correctionStatusLabel = `Partial Correction (Cleared > ${threshold}s bunching, below ${target}s target)`;
  }

  const restorationPct = target > 0 ? Number(Math.min(100, (projected / target) * 100).toFixed(1)) : 0;

  return {
    available: true,
    baselineSeparationSeconds: baseSep,
    holdDurationSeconds: hold,
    projectedSeparationSeconds: projected,
    bunchingThresholdSeconds: threshold,
    targetHeadwaySeconds: target,
    maxHoldingAllowanceSeconds: maxAllowance,
    bunchingCleared,
    correctionStatus,
    correctionStatusLabel,
    headwayRestorationPct: restorationPct,
    exceedsHoldingAllowance: input.holdDurationSeconds > maxAllowance,
    notes: hold === maxAllowance
      ? `Maximum approved ${maxAllowance}s holding intervention yields exactly ${projected}s projected separation (restoring ${restorationPct}% of nominal ${target}s headway).`
      : `Holding for ${hold}s yields ${projected}s projected separation.`,
    limitations: `Assumes trailing vehicle ${busLabel} is actively dwelling at ${stopLabel} control point. Downstream dwell times, traffic signals, and passenger boarding surges are not modeled.`
  };
}

/**
 * Simulate Standby Relief Deployment on Evening Service Gap Scenario
 * Evaluates standby deployment at Hebbal DOWN (18:15:00).
 */
export function simulateStandbyReliefScenario(
  input: StandbyReliefInput,
  baseline?: ReliefBaselineParams
): StandbyReliefResult {
  if (
    !baseline ||
    baseline.measuredGapSeconds === undefined ||
    baseline.largeGapThresholdSeconds === undefined ||
    !baseline.vehicles ||
    !baseline.drivers
  ) {
    return {
      available: false,
      unavailableReason: 'Relief baseline parameters or fleet/crew records unavailable from operational engine.',
      location: baseline?.terminalName ?? 'Unknown Terminal',
      direction: 'DOWN',
      measuredGapSeconds: null,
      largeGapThresholdSeconds: null,
      cancelledTripId: baseline?.cancelledTripId ?? null,
      standbyBusId: input?.standbyBusId ?? null,
      standbyBusLocation: null,
      busStagedAtTerminal: false,
      standbyDriverId: input?.standbyDriverId ?? null,
      driverShiftWindow: null,
      driverOnShiftAtEvalTime: false,
      feasibilityStatus: 'unavailable',
      feasibilitySummary: 'Cannot simulate relief deployment: required service gap or fleet/crew records are missing.',
      estimatedDispatchWindowMinutes: 'Dispatch timing is not estimated from available data',
      limitations: 'Simulation blocked: source observation missing.'
    };
  }

  const measuredGap = baseline.measuredGapSeconds;
  const threshold = baseline.largeGapThresholdSeconds;
  const termName = baseline.terminalName ?? 'Hebbal DOWN Terminal';
  const cancelledId = baseline.cancelledTripId ?? 'Unknown trip';

  // Dynamic evaluation using baseline records without hardcoded fallbacks
  let busStagedAtHebbal = false;
  let busLocation = 'Unknown vehicle location';

  const vMatch = baseline.vehicles.find((v) => v.busId === input.standbyBusId);
  if (vMatch) {
    busStagedAtHebbal = vMatch.isStagedAtHebbal;
    busLocation = `${vMatch.location} (${vMatch.status})`;
  } else {
    busLocation = `Vehicle ${input.standbyBusId} not found in fleet records`;
  }

  let driverOnShift = false;
  let shiftWindow = 'Not on duty';

  const dMatch = baseline.drivers.find((d) => d.crewId === input.standbyDriverId);
  if (dMatch) {
    driverOnShift = dMatch.isOnShiftAt1815;
    shiftWindow = dMatch.shiftHours;
  } else {
    shiftWindow = `Driver ${input.standbyDriverId} not found in crew records`;
  }

  const isFeasible = busStagedAtHebbal && driverOnShift;

  return {
    available: true,
    location: termName,
    direction: 'DOWN',
    measuredGapSeconds: measuredGap,
    largeGapThresholdSeconds: threshold,
    cancelledTripId: cancelledId,
    standbyBusId: input.standbyBusId,
    standbyBusLocation: busLocation,
    busStagedAtTerminal: busStagedAtHebbal,
    standbyDriverId: input.standbyDriverId,
    driverShiftWindow: shiftWindow,
    driverOnShiftAtEvalTime: driverOnShift,
    feasibilityStatus: isFeasible ? 'feasible' : 'unconfirmed',
    feasibilitySummary: isFeasible
      ? `FEASIBLE: Standby vehicle ${input.standbyBusId} is confirmed staged at Hebbal DOWN, and standby driver ${input.standbyDriverId} is on Shift 2 duty.`
      : `UNCONFIRMED: ${!busStagedAtHebbal ? `Vehicle ${input.standbyBusId} is not staged at Hebbal DOWN. ` : ''}${!driverOnShift ? `Driver ${input.standbyDriverId} is not on shift at 18:15:00.` : ''}`,
    estimatedDispatchWindowMinutes: 'Dispatch timing is not estimated from available data',
    limitations: 'Standby resource feasibility only — actual deployment time, deadhead transit, and downstream service impact cannot be estimated from the available data.'
  };
}

/**
 * Retrieve Crowding Baseline and Frequency Increase Eligibility
 */
export function simulateCrowdingScenario(baseline?: CrowdingBaselineParams): CrowdingScenarioResult {
  if (
    !baseline ||
    baseline.designCapacity === undefined ||
    baseline.observedPeakPassengers === undefined ||
    baseline.observedPeakOccupancyPct === undefined
  ) {
    return {
      available: false,
      unavailableReason: 'Crowding baseline parameters unavailable from operational engine.',
      designCapacity: null,
      seatedCapacity: null,
      standingCapacity: null,
      warningThresholdPct: 100,
      severeThresholdPct: 150,
      observedPeakPassengers: null,
      observedPeakOccupancyPct: null,
      peakStopName: null,
      peakTripId: null,
      totalEvaluatedVisits: null,
      normalVisits: null,
      overcrowdedVisits: null,
      severelyOvercrowdedVisits: null,
      frequencyIncreaseRule: 'Trigger requires ≥ 3 consecutive severely overcrowded stop visits on the same trip.',
      frequencyIncreaseEligible: false,
      frequencyIncreaseReason: 'Cannot evaluate frequency increase: crowding observations missing from source data.',
      limitations: 'Simulation blocked: source observation missing.'
    };
  }

  const cap = baseline.designCapacity;
  const seated = baseline.seatedCapacity !== undefined ? baseline.seatedCapacity : null;
  const standing = baseline.standingCapacity !== undefined ? baseline.standingCapacity : null;
  const peakPax = baseline.observedPeakPassengers;
  const peakPct = baseline.observedPeakOccupancyPct;
  const peakStop = baseline.peakStopName ?? 'Not available';
  const peakTrip = baseline.peakTripId ?? 'Not available';
  const totalVisits = baseline.totalEvaluatedVisits ?? 0;
  const normalVisits = baseline.normalVisits ?? 0;
  const overcrowdedVisits = baseline.overcrowdedVisits ?? 0;
  const severeVisits = baseline.severelyOvercrowdedVisits ?? 0;
  const rule = baseline.frequencyIncreaseRule ?? 'Trigger requires ≥ 3 consecutive severely overcrowded stop visits on the same trip.';
  const eligible = baseline.frequencyIncreaseEligible ?? false;
  const reason = baseline.frequencyIncreaseReason ?? 'Not triggered: Consecutive severe crowding threshold not met.';

  return {
    available: true,
    designCapacity: cap,
    seatedCapacity: seated,
    standingCapacity: standing,
    warningThresholdPct: 100,
    severeThresholdPct: 150,
    observedPeakPassengers: peakPax,
    observedPeakOccupancyPct: peakPct,
    peakStopName: peakStop,
    peakTripId: peakTrip,
    totalEvaluatedVisits: totalVisits,
    normalVisits,
    overcrowdedVisits,
    severelyOvercrowdedVisits: severeVisits,
    frequencyIncreaseRule: rule,
    frequencyIncreaseEligible: eligible,
    frequencyIncreaseReason: reason,
    limitations: 'Crowding evaluation reflects historical passenger counting observations on 10 March 2025. Does not predict future boarding surges or dynamic demand shifts.'
  };
}
