import 'server-only';

/**
 * HOGANA — Step 5: Data-Backed Scenario Simulation Service
 * 
 * Derives operational baseline data directly from the approved Step 1 dataset
 * and Step 2 backend engine models to power the interactive simulator.
 * 
 * Invariants:
 * - Loads source data strictly via getCompleteDataset() and getDashboardData().
 * - Derives morning bunching, evening gap, fleet/crew availability, and crowding dynamically.
 * - Leaves approved source records untouched.
 */

import { getCompleteDataset } from '../dataset/data-access';
import { getDashboardData } from './dashboard-service';
import { evaluateFrequencyIncreaseRecommendation } from './crowding';

export interface VehicleOption {
  busId: string;
  status: 'active' | 'standby' | 'maintenance';
  location: string;
  isStagedAtHebbal: boolean;
  label: string;
}

export interface DriverOption {
  crewId: string;
  shiftType: string;
  shiftHours: string;
  isOnShiftAt1815: boolean;
  label: string;
}

export interface SimulationBaselineData {
  holding: {
    baselineSeparationSeconds: number; // 75
    bunchingThresholdSeconds: number; // 120
    targetHeadwaySeconds: number; // 720
    maxHoldingAllowanceSeconds: number; // 300
    controlStopName: string; // Marathahalli UP
    leadingBusId: string; // BUS-06
    trailingBusId: string; // BUS-07
    trailingTripId: string; // T-UP-007
    evaluationTimestamp: string; // 2025-03-10T08:24:00
  };
  relief: {
    measuredGapSeconds: number; // 1440
    largeGapThresholdSeconds: number; // 1080
    cancelledTripId: string; // T-DN-033
    terminalName: string; // Hebbal DOWN Terminal
    evaluationTimestamp: string; // 2025-03-10T18:15:00
    vehicles: VehicleOption[];
    drivers: DriverOption[];
    defaultBusId: string;
    defaultDriverId: string;
  };
  crowding: {
    designCapacity: number; // 60
    seatedCapacity: number; // 40
    standingCapacity: number; // 20
    warningThresholdPct: number; // 100
    severeThresholdPct: number; // 150
    observedPeakPassengers: number; // 92
    observedPeakOccupancyPct: number; // 153.3
    peakStopName: string; // Kadubeesanahalli UP
    peakTripId: string; // T-UP-006
    totalEvaluatedVisits: number; // 924
    normalVisits: number;
    overcrowdedVisits: number;
    severelyOvercrowdedVisits: number;
    frequencyIncreaseRule: string;
    frequencyIncreaseEligible: boolean;
    frequencyIncreaseReason: string;
  };
}

export interface SimulationResponse {
  success: boolean;
  data?: SimulationBaselineData;
  error?: {
    message: string;
  };
}

export async function getSimulationBaselineData(): Promise<SimulationResponse> {
  try {
    const [dataset, morningRes, eveningRes, eodRes] = await Promise.all([
      getCompleteDataset(),
      getDashboardData('morning'),
      getDashboardData('evening'),
      getDashboardData('eod')
    ]);

    if (!morningRes.success || !morningRes.data || !eveningRes.success || !eveningRes.data || !eodRes.success || !eodRes.data) {
      throw new Error('Unable to compute operational baseline view models for simulation.');
    }

    const morning = morningRes.data.currentView;
    const evening = eveningRes.data.currentView;
    const eod = eodRes.data.currentView;

    // 1. Morning Bunching Baseline Anchor
    const bunchingAlert = morning.bunchingSummary.detectedAlerts.find(
      (a) => a.stopId === 'marathahalli-up'
    );
    const holdRec = morning.bunchingSummary.holdingRecommendation;

    if (
      !bunchingAlert ||
      bunchingAlert.measuredSeconds === undefined ||
      bunchingAlert.thresholdSeconds === undefined ||
      !holdRec ||
      holdRec.targetHeadwaySeconds === undefined ||
      holdRec.feasibleHoldSeconds === undefined ||
      !holdRec.trailingBusId ||
      !holdRec.controlStopName
    ) {
      throw new Error(
        'Holding baseline cannot be computed: valid bunching alert or holding recommendation missing from morning operational engine output.'
      );
    }

    const holdingBaseline = {
      baselineSeparationSeconds: bunchingAlert.measuredSeconds,
      bunchingThresholdSeconds: bunchingAlert.thresholdSeconds,
      targetHeadwaySeconds: holdRec.targetHeadwaySeconds,
      maxHoldingAllowanceSeconds: holdRec.feasibleHoldSeconds,
      controlStopName: holdRec.controlStopName,
      leadingBusId: bunchingAlert.leadingBusId,
      trailingBusId: holdRec.trailingBusId,
      trailingTripId: holdRec.trailingTripId ?? bunchingAlert.trailingTripId,
      evaluationTimestamp: morning.evaluationTimestamp ?? '2025-03-10T08:24:00'
    };

    // 2. Evening Large Gap Baseline Anchor & Fleet/Crew Options
    const demoGap = evening.serviceGapsSummary.detectedGaps.find(
      (g) => g.stopId === 'hebbal-down' || g.gapType === 'terminal_departure_gap'
    );
    const reliefRec = evening.serviceGapsSummary.reliefRecommendation;

    if (
      !demoGap ||
      demoGap.measuredSeconds === undefined ||
      demoGap.thresholdSeconds === undefined ||
      !reliefRec ||
      !reliefRec.standbyBusId ||
      !reliefRec.standbyDriverId
    ) {
      throw new Error(
        'Relief baseline cannot be computed: valid service gap alert or relief recommendation missing from evening operational engine output.'
      );
    }

    const defaultBusId = reliefRec.standbyBusId;
    const defaultDriverId = reliefRec.standbyDriverId;

    const vehicleOptions: VehicleOption[] = dataset.vehicles
      .filter((v) => v.status === 'standby' || v.status === 'maintenance')
      .map((v) => {
        const isStagedAtHebbal = v.status === 'standby' && v.current_location_stop_id === 'hebbal-down';
        let label = `${v.bus_id} (${v.status.toUpperCase()}`;
        if (v.current_location_stop_id) {
          label += ` @ ${v.current_location_stop_id}`;
        }
        label += ')';
        return {
          busId: v.bus_id,
          status: v.status,
          location: v.current_location_stop_id ?? 'Unknown depot',
          isStagedAtHebbal,
          label
        };
      });

    if (vehicleOptions.length === 0) {
      throw new Error('No standby or maintenance vehicle records available for relief simulation.');
    }

    // Provide representative crew options from the dataset
    const driverOptions: DriverOption[] = dataset.crewAvailability
      .filter((c) => c.crew_id === defaultDriverId || c.crew_id === 'CREW-12' || c.assigned_bus_id === null)
      .slice(0, 4)
      .map((c) => {
        const isOnShiftAt1815 = c.shift_start <= '18:15:00' && c.shift_end > '18:15:00';
        const shiftType = c.shift_start >= '14:00' ? 'Shift 2' : 'Shift 1';
        return {
          crewId: c.crew_id,
          shiftType,
          shiftHours: `${c.shift_start.slice(0, 5)} - ${c.shift_end.slice(0, 5)}`,
          isOnShiftAt1815,
          label: `${c.crew_id} (${shiftType}: ${c.shift_start.slice(0, 5)}-${c.shift_end.slice(0, 5)} ${isOnShiftAt1815 ? '• On-Duty' : '• Off-Duty'})`
        };
      });

    if (driverOptions.length === 0) {
      throw new Error('No standby crew records available for relief simulation.');
    }

    const reliefBaseline = {
      measuredGapSeconds: demoGap.measuredSeconds,
      largeGapThresholdSeconds: demoGap.thresholdSeconds,
      cancelledTripId: 'T-DN-033',
      terminalName: demoGap.stopName ?? 'Hebbal DOWN Terminal',
      evaluationTimestamp: evening.evaluationTimestamp ?? '2025-03-10T18:15:00',
      vehicles: vehicleOptions,
      drivers: driverOptions,
      defaultBusId,
      defaultDriverId
    };

    // 3. Crowding Baseline Anchor & Policy Rule Evaluation
    const firstBus = dataset.vehicles.find((v) => v.capacity_total > 0);
    if (!firstBus || !firstBus.capacity_seated || !firstBus.capacity_standing) {
      throw new Error('Vehicle capacity information missing from fleet records.');
    }
    const seatedCap = firstBus.capacity_seated;
    const standingCap = firstBus.capacity_standing;
    const totalCap = firstBus.capacity_total;

    let peakLoad = -1;
    let peakTrip = '';
    let peakStop = '';
    for (const pl of dataset.passengerLoads) {
      if (pl.onboard_after !== null && pl.onboard_after > peakLoad) {
        peakLoad = pl.onboard_after;
        peakTrip = pl.trip_id;
        peakStop = pl.stop_id;
      }
    }

    if (peakLoad < 0 || !peakTrip || !peakStop) {
      throw new Error('Passenger load observations missing from dataset.');
    }

    const peakPct = Number(((peakLoad / totalCap) * 100).toFixed(1));
    const stopMatch = dataset.stops.find((s) => s.stop_id === peakStop);
    const peakStopName = stopMatch ? `${stopMatch.stop_name} ${stopMatch.direction}` : peakStop;

    // Evaluate frequency increase rule with Step 2 engine across the peak trip
    const freqEval = evaluateFrequencyIncreaseRecommendation({
      tripId: peakTrip,
      routeId: '500-D',
      direction: 'UP',
      tripLoads: dataset.passengerLoads,
      vehicles: dataset.vehicles,
      scheduledTrips: dataset.scheduledTrips
    });

    const crowdingBaseline = {
      designCapacity: totalCap,
      seatedCapacity: seatedCap,
      standingCapacity: standingCap,
      warningThresholdPct: 100,
      severeThresholdPct: 150,
      observedPeakPassengers: peakLoad,
      observedPeakOccupancyPct: peakPct,
      peakStopName,
      peakTripId: peakTrip,
      totalEvaluatedVisits: eod.crowdingSummary.totalEvaluatedVisits,
      normalVisits: eod.crowdingSummary.normalCount,
      overcrowdedVisits: eod.crowdingSummary.overcrowdedCount,
      severelyOvercrowdedVisits: eod.crowdingSummary.severelyOvercrowdedCount,
      frequencyIncreaseRule: 'Trigger requires ≥ 3 consecutive severely overcrowded stop visits (≥ 150% capacity / ≥ 90 passengers) on the same trip.',
      frequencyIncreaseEligible: freqEval.status === 'recommended',
      frequencyIncreaseReason: freqEval.recommendationText
    };

    return {
      success: true,
      data: {
        holding: holdingBaseline,
        relief: reliefBaseline,
        crowding: crowdingBaseline
      }
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown simulation service error';
    return {
      success: false,
      error: { message: errorMsg }
    };
  }
}
