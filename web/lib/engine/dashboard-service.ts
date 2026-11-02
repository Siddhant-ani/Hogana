import 'server-only';

/**
 * HOGANA — Step 3: Server-Side Dashboard Service
 * 
 * Orchestrates Step 1 validated dataset access and Step 2 operational intelligence calculations
 * for the three approved dashboard evaluation views:
 * 1. End-of-Day Audit ('eod'): Historical final-outcome baseline across all 86 trips on 10 March 2025.
 * 2. Morning Replay ('morning'): As-of evaluation at 2025-03-10T08:24:00 (morning bunching scenario).
 * 3. Evening Replay ('evening'): As-of evaluation at 2025-03-10T18:15:00 (evening large gap scenario).
 * 
 * Invariants:
 * - Anti-lookahead enforced: Replay modes never mix end-of-day outcomes or expose future events.
 * - Missing metrics are explicitly flagged as unavailable (never silently converted to zero).
 * - Full baseline reconciliation in EOD mode (86 scheduled, 77 operated, 2 cancelled, 7 shortfall).
 */

import { getValidatedDataset } from '../dataset/data-access';
import {
  calculateCorridorKpis,
  calculateReplayCorridorStatus
} from './operational-kpis';
import {
  calculateObservedHeadways,
  calculateHeadwayCV
} from './headway';
import {
  detectStopArrivalBunching,
  evaluateHoldRecommendation
} from './bunching';
import {
  detectLargeGapsFromArrivals,
  detectTerminalDepartureGaps
} from './service-gaps';
import {
  evaluateReliefBusRecommendation,
  getFleetInventory,
  getStandbyDriverAvailability
} from './fleet-availability';
import {
  calculatePassengerOccupancy,
  detectCrowdingAlerts
} from './crowding';
import { calculateOnTimePerformance } from './schedule-performance';
import { Stop } from '../dataset/types';
import { getDatasetRepository } from '../supabase/dataset-repository';

export type EvaluationViewId = 'eod' | 'morning' | 'evening';

export interface DashboardViewData {
  viewId: EvaluationViewId;
  viewTitle: string;
  viewSubtitle: string;
  evaluationTimestamp: string | null;
  isReplay: boolean;

  // 1. KPI Overview (§5.B)
  kpis: {
    totalScheduledTrips: number;
    operatedTrips: number;
    operatedTripsLabel: string;
    fulfillmentRatePct: number;
    cancelledTrips: number;
    cancellationRatePct: number;
    resourceShortfallTrips: number;
    resourceShortfallRatePct: number;
    combinedNonOperatedRatePct: number;
    replayStatus?: {
      scheduledCount: number;
      inProgressCount: number;
      completedCount: number;
      cancelledCount: number;
      resourceShortfallCount: number;
      unknownCount: number;
    };
  };

  // 2. Headway Monitoring (§5.C.1)
  headwaySummary: {
    available: boolean;
    unavailableReason?: string;
    targetPeakMinutes: number;
    targetOffpeakMinutes: number;
    keyStops: Array<{
      stopId: string;
      stopName: string;
      direction: 'UP' | 'DOWN';
      observedCount: number;
      meanHeadwaySeconds: number | null;
      meanHeadwayMinutes: number | null;
      cv: number | null;
      regularityStatus: 'regular' | 'irregular' | 'severely_irregular' | 'insufficient_data';
      windowLabel: string;
    }>;
    otpSummary: {
      available: boolean;
      totalKnownVisits: number;
      onTimePct: number;
      latePct: number;
      earlyPct: number;
      onTimeThresholdSeconds: number;
    };
  };

  // 3. Bus Bunching (§5.C.2)
  bunchingSummary: {
    available: boolean;
    detectedAlerts: Array<{
      stopId: string;
      stopName: string;
      direction: 'UP' | 'DOWN';
      leadingBusId: string;
      trailingBusId: string;
      leadingTripId: string;
      trailingTripId: string;
      measuredSeconds: number;
      thresholdSeconds: number;
      timestamp: string;
      bunchingType: string;
      note?: string;
    }>;
    holdingRecommendation: {
      status: 'recommended' | 'rejected' | 'ineligible' | 'not_applicable';
      controlStopName?: string;
      direction?: 'UP' | 'DOWN';
      leadingBusId?: string;
      trailingBusId?: string;
      leadingTripId?: string;
      trailingTripId?: string;
      currentSeparationSeconds?: number;
      targetHeadwaySeconds?: number;
      feasibleHoldSeconds?: number;
      projectedSeparationSeconds?: number;
      isPartialCorrection?: boolean;
      recommendationText: string;
      disclaimer?: string;
    };
  };

  // 4. Large Service Gaps (§5.C.3)
  serviceGapsSummary: {
    available: boolean;
    detectedGaps: Array<{
      stopId: string;
      stopName: string;
      direction: 'UP' | 'DOWN';
      leadingBusId: string;
      trailingBusId: string;
      leadingTripId: string;
      trailingTripId: string;
      measuredSeconds: number;
      nominalScheduledHeadwaySeconds: number;
      thresholdSeconds: number;
      gapType: string;
      timestamp: string;
      note?: string;
    }>;
    reliefRecommendation: {
      status: 'feasible' | 'unconfirmed' | 'not_applicable';
      direction?: 'UP' | 'DOWN';
      standbyBusId?: string | null;
      standbyDriverId?: string | null;
      stagedTerminalName?: string;
      recommendationText: string;
      unconfirmedReason?: string;
      limitationsDisclaimer?: string;
    };
  };

  // 5. Crowding & Occupancy (§5.C.4)
  crowdingSummary: {
    available: boolean;
    unavailableReason?: string;
    totalEvaluatedVisits: number;
    normalCount: number;
    overcrowdedCount: number; // 100% - 150% of design capacity (60 - 89 pax)
    severelyOvercrowdedCount: number; // >= 150% of design capacity (>= 90 pax)
    peakOccupancyPct: number | null;
    peakOnboardPassengers: number | null;
    peakOccupancyStopName: string | null;
    peakOccupancyBusId: string | null;
    peakOccupancyTripId?: string | null;
    severelyOvercrowdedObservations: Array<{
      tripId: string;
      busId: string;
      stopId: string;
      stopName: string;
      occupancyPct: number;
      onboardPassengers: number;
      timestamp: string;
    }>;
    activeSeverelyOvercrowdedAlerts: Array<{
      tripId: string;
      busId: string;
      stopId: string;
      stopName: string;
      occupancyPct: number;
      onboardPassengers: number;
      timestamp: string;
    }>;
  };

  // 6. Fleet Availability (§5.C.5)
  fleetSummary: {
    totalVehicles: number;
    activeCount: number;
    standbyCount: number;
    maintenanceCount: number;
    standbyBuses: Array<{
      busId: string;
      registration: string;
      stagedTerminal: string;
      capacity: number;
    }>;
    maintenanceBuses: Array<{
      busId: string;
      location: string;
      reason: string;
    }>;
    crewShiftStatus: {
      evaluationTime?: string;
      onShiftStandbyDrivers: Array<{
        crewId: string;
        shift: string;
      }>;
      offShiftStandbyDrivers: Array<{
        crewId: string;
        shift: string;
      }>;
    };
    limitationsDisclaimer: string;
  };
}

export interface DashboardResponse {
  success: boolean;
  data?: {
    currentView: DashboardViewData;
    availableViews: Array<{
      id: EvaluationViewId;
      title: string;
      timeLabel: string;
      badge: string;
    }>;
    datasetDate: string;
    corridorName: string;
    datasetVersionInfo?: {
      id: string;
      name: string;
      versionNumber: number;
      date: string;
      source: string;
      status: string;
    };
  };
  error?: {
    message: string;
    validationErrors?: string[];
  };
}

/**
 * Builds the complete dashboard view model for the requested evaluation mode.
 */
export async function getDashboardData(requestedView: EvaluationViewId = 'eod'): Promise<DashboardResponse> {
  try {
    const repo = getDatasetRepository();
    const versionInfo = await repo.getVersionInfo();
    const { dataset, validationReport } = await getValidatedDataset();
    const {
      stops,
      scheduledTrips,
      stopTimes,
      passengerLoads,
      busPositions,
      vehicles,
      crewAvailability,
      assumptions
    } = dataset;

    if (!validationReport.valid) {
      return {
        success: false,
        error: {
          message: 'Dataset failed Step 1 validation. Operational intelligence engine halted.',
          validationErrors: validationReport.errors
        }
      };
    }

    const stopMap = new Map<string, Stop>();
    for (const s of stops) {
      stopMap.set(s.stop_id, s);
    }

    // Determine evaluation settings for the requested view
    const isEod = requestedView === 'eod';
    const isMorning = requestedView === 'morning';
    const isEvening = requestedView === 'evening';

    const tEval = isMorning
      ? '2025-03-10T08:24:00'
      : isEvening
      ? '2025-03-10T18:15:00'
      : undefined;

    // 1. KPI Calculation
    const kpisResult = calculateCorridorKpis({
      scheduledTrips,
      stopTimes: tEval ? stopTimes : undefined,
      evaluationTime: tEval
    });

    const replayStatusResult = tEval
      ? calculateReplayCorridorStatus({
          scheduledTrips,
          stopTimes,
          evaluationTime: tEval
        })
      : undefined;

    // 2. Headway Monitoring & Irregularity CV
    const keyStopConfigs = [
      { stopId: 'marathahalli-up', direction: 'UP' as const, windowStart: '2025-03-10T07:00:00', windowEnd: '2025-03-10T09:00:00', label: 'Morning Peak (07:00–09:00)' },
      { stopId: 'silk-board-up', direction: 'UP' as const, windowStart: '2025-03-10T06:00:00', windowEnd: '2025-03-10T22:00:00', label: 'Full Operating Day' },
      { stopId: 'hebbal-down', direction: 'DOWN' as const, windowStart: '2025-03-10T17:00:00', windowEnd: '2025-03-10T19:00:00', label: 'Evening Peak (17:00–19:00)' }
    ];

    const keyStopsData = keyStopConfigs.map((cfg) => {
      const stop = stopMap.get(cfg.stopId);
      const stopName = stop?.stop_name ?? cfg.stopId;

      const observed = calculateObservedHeadways({
        stopId: cfg.stopId,
        direction: cfg.direction,
        stopTimes,
        scheduledTrips,
        evaluationTime: tEval
      });

      const cvResult = calculateHeadwayCV({
        stopId: cfg.stopId,
        direction: cfg.direction,
        timeWindowStart: cfg.windowStart,
        timeWindowEnd: cfg.windowEnd,
        stopTimes,
        scheduledTrips,
        evaluationTime: tEval
      });

      const meanSec = cvResult.meanHeadwaySeconds;
      const meanMin = meanSec !== null ? Math.round((meanSec / 60) * 10) / 10 : null;

      const regularityStatus =
        cvResult.cv === null
          ? ('insufficient_data' as const)
          : cvResult.cv <= 0.25
          ? ('regular' as const)
          : cvResult.cv <= 0.4
          ? ('irregular' as const)
          : ('severely_irregular' as const);

      return {
        stopId: cfg.stopId,
        stopName,
        direction: cfg.direction,
        observedCount: observed.headways.length,
        meanHeadwaySeconds: meanSec,
        meanHeadwayMinutes: meanMin,
        cv: cvResult.cv,
        regularityStatus,
        windowLabel: cfg.label
      };
    });

    // Corridor On-Time Performance (OTP)
    const otp = calculateOnTimePerformance({
      routeId: 'silk-board-hebbal',
      stopTimes,
      scheduledTrips,
      thresholdSeconds: 120,
      evaluationTime: tEval
    });

    const latePct = otp.totalKnownVisits > 0 ? Number(((otp.lateVisits / otp.totalKnownVisits) * 100).toFixed(1)) : 0;
    const earlyPct = otp.totalKnownVisits > 0 ? Number(((otp.earlyVisits / otp.totalKnownVisits) * 100).toFixed(1)) : 0;

    // 3. Bus Bunching & Holding Recommendations
    const detectedBunchingAlerts: DashboardViewData['bunchingSummary']['detectedAlerts'] = [];

    for (const stop of stops) {
      const arrivalBunchings = detectStopArrivalBunching({
        stopId: stop.stop_id,
        direction: stop.direction,
        stopTimes,
        scheduledTrips,
        assumptions,
        evaluationTime: tEval
      });

      for (const a of arrivalBunchings) {
        detectedBunchingAlerts.push({
          stopId: a.stop_id,
          stopName: stop.stop_name,
          direction: a.direction,
          leadingBusId: a.bus_id_leading,
          trailingBusId: a.bus_id_trailing,
          leadingTripId: a.trip_id_leading,
          trailingTripId: a.trip_id_trailing,
          measuredSeconds: a.measured_seconds,
          thresholdSeconds: a.threshold_seconds,
          timestamp: a.timestamp,
          bunchingType: 'Arrival Headway < 120s',
          note: a.note
        });
      }
    }

    let holdingRec: DashboardViewData['bunchingSummary']['holdingRecommendation'] = {
      status: 'not_applicable',
      recommendationText: isEod
        ? 'Live holding interventions are not evaluated in historical End-of-Day audit mode. Switch to Morning or Evening Replay for as-of holding evaluation.'
        : 'No active bus bunching currently qualifies for dispatcher holding at a control point.'
    };

    if (isMorning) {
      const marathahalliStop = stopMap.get('marathahalli-up');
      if (marathahalliStop) {
        const holdEval = evaluateHoldRecommendation({
          controlStopId: 'marathahalli-up',
          direction: 'UP',
          stop: marathahalliStop,
          scheduledTrips,
          stopTimes,
          busPositions,
          evaluationTime: tEval!,
          assumptions
        });

        if (holdEval.alert) {
          detectedBunchingAlerts.unshift({
            stopId: holdEval.alert.stop_id,
            stopName: marathahalliStop.stop_name,
            direction: holdEval.alert.direction,
            leadingBusId: holdEval.alert.bus_id_leading,
            trailingBusId: holdEval.alert.bus_id_trailing,
            leadingTripId: holdEval.alert.trip_id_leading,
            trailingTripId: holdEval.alert.trip_id_trailing,
            measuredSeconds: holdEval.alert.measured_seconds,
            thresholdSeconds: holdEval.alert.threshold_seconds,
            timestamp: holdEval.alert.timestamp,
            bunchingType: 'Live Dwelling Departure Separation',
            note: holdEval.alert.note
          });
        }

        if (holdEval.recommendation) {
          holdingRec = {
            status: holdEval.recommendation.status,
            controlStopName: holdEval.recommendation.controlStopName,
            direction: holdEval.recommendation.direction,
            leadingBusId: holdEval.recommendation.leadingBusId,
            trailingBusId: holdEval.recommendation.trailingBusId,
            leadingTripId: holdEval.recommendation.leadingTripId,
            trailingTripId: holdEval.recommendation.trailingTripId,
            currentSeparationSeconds: holdEval.recommendation.currentElapsedSeparationSeconds,
            targetHeadwaySeconds: holdEval.recommendation.targetHeadwaySeconds,
            feasibleHoldSeconds: holdEval.recommendation.feasibleHoldSeconds,
            projectedSeparationSeconds: holdEval.recommendation.projectedSeparationSeconds,
            isPartialCorrection: holdEval.recommendation.isPartialCorrection,
            recommendationText: holdEval.recommendation.recommendationText,
            disclaimer:
              'Dispatcher Advisory: This is a decision-support advisory hold recommendation. Implementation requires manual authorization by the corridor dispatcher. Automatic dispatch intervention is prohibited.'
          };
        }
      }
    }

    // 4. Large Service Gaps & Relief Recommendations
    const detectedGaps: DashboardViewData['serviceGapsSummary']['detectedGaps'] = [];

    for (const stop of stops) {
      const arrGaps = detectLargeGapsFromArrivals({
        stopId: stop.stop_id,
        direction: stop.direction,
        stopTimes,
        scheduledTrips,
        assumptions,
        evaluationTime: tEval
      });

      for (const g of arrGaps) {
        detectedGaps.push({
          stopId: g.stop_id,
          stopName: stop.stop_name,
          direction: g.direction,
          leadingBusId: g.bus_id_leading,
          trailingBusId: g.bus_id_trailing,
          leadingTripId: g.trip_id_leading,
          trailingTripId: g.trip_id_trailing,
          measuredSeconds: g.measured_seconds,
          nominalScheduledHeadwaySeconds: g.nominal_scheduled_headway_seconds,
          thresholdSeconds: g.threshold_seconds,
          gapType: 'Arrival Gap (>1.5x scheduled)',
          timestamp: g.timestamp,
          note: g.note
        });
      }
    }

    const terminalGaps = [
      ...detectTerminalDepartureGaps({
        originStopId: 'hebbal-down',
        direction: 'DOWN',
        stopTimes,
        scheduledTrips,
        assumptions,
        evaluationTime: tEval
      }),
      ...detectTerminalDepartureGaps({
        originStopId: 'silk-board-up',
        direction: 'UP',
        stopTimes,
        scheduledTrips,
        assumptions,
        evaluationTime: tEval
      })
    ];

    for (const tg of terminalGaps) {
      const stp = stopMap.get(tg.stop_id);
      detectedGaps.push({
        stopId: tg.stop_id,
        stopName: stp?.stop_name ?? tg.stop_id,
        direction: tg.direction,
        leadingBusId: tg.bus_id_leading,
        trailingBusId: tg.bus_id_trailing,
        leadingTripId: tg.trip_id_leading,
        trailingTripId: tg.trip_id_trailing,
        measuredSeconds: tg.measured_seconds,
        nominalScheduledHeadwaySeconds: tg.nominal_scheduled_headway_seconds,
        thresholdSeconds: tg.threshold_seconds,
        gapType: 'Terminal Departure Gap',
        timestamp: tg.timestamp,
        note: tg.note
      });
    }

    let reliefRec: DashboardViewData['serviceGapsSummary']['reliefRecommendation'] = {
      status: 'not_applicable',
      recommendationText: isEod
        ? 'Relief bus deployment recommendations are not evaluated in historical End-of-Day audit mode. Switch to Evening Replay to view the cancelled-trip gap response.'
        : 'No terminal departure gap currently requires standby relief deployment.'
    };

    if (isEvening) {
      const eveningDemoGap = terminalGaps.find(
        (g) => g.trip_id_leading === 'T-DN-032' && g.trip_id_trailing === 'T-DN-034'
      );

      if (eveningDemoGap) {
        const reliefEval = evaluateReliefBusRecommendation({
          gapAlert: eveningDemoGap,
          routeId: 'silk-board-hebbal',
          direction: 'DOWN',
          vehicles,
          crewAvailability,
          stops,
          evaluationTime: tEval!
        });

        reliefRec = {
          status: reliefEval.status === 'feasible' ? 'feasible' : 'unconfirmed',
          direction: reliefEval.direction,
          standbyBusId: reliefEval.standbyBusId,
          standbyDriverId: reliefEval.standbyDriverId,
          stagedTerminalName: 'Hebbal Terminal (DOWN)',
          recommendationText: reliefEval.recommendationText,
          unconfirmedReason: reliefEval.unconfirmedReason,
          limitationsDisclaimer: reliefEval.limitationsDisclaimer
        };
      }
    }

    // 5. Crowding & Occupancy (§5.C.4)
    const occupancyRecords = calculatePassengerOccupancy({
      passengerLoads,
      vehicles,
      scheduledTrips,
      stopTimes,
      evaluationTime: tEval,
      assumptions
    });

    const validLoads = occupancyRecords.filter(
      (o) => o.level !== 'error' && o.level !== 'unavailable'
    );

    const normalCount = validLoads.filter((o) => o.level === 'normal').length;
    const overcrowdedCount = validLoads.filter((o) => o.level === 'overcrowded').length;
    const severelyOvercrowdedCount = validLoads.filter(
      (o) => o.level === 'severely_overcrowded'
    ).length;

    let peakOcc = 0;
    let peakPax = 0;
    let peakStop = 'None';
    let peakBus = 'None';
    let peakTrip = 'None';

    for (const o of validLoads) {
      if (o.occupancyPct !== null && o.occupancyPct > peakOcc) {
        peakOcc = o.occupancyPct;
        peakPax = o.onboardAfter ?? 0;
        peakStop = stopMap.get(o.stopId)?.stop_name ?? o.stopId;
        peakBus = o.busId;
        peakTrip = o.tripId;
      }
    }

    const severeAlerts = detectCrowdingAlerts(occupancyRecords).slice(0, 5);

    const activeCrowdingAlerts = severeAlerts.map((a) => ({
      tripId: a.trip_id,
      busId: a.bus_id,
      stopId: a.stop_id,
      stopName: stopMap.get(a.stop_id)?.stop_name ?? a.stop_id,
      occupancyPct: a.occupancy_pct,
      onboardPassengers: a.onboard_after,
      timestamp: a.timestamp
    }));

    // 6. Fleet Availability (§5.C.5)
    const fleetInv = getFleetInventory(vehicles);
    const standbyDrivers = getStandbyDriverAvailability({
      crewAvailability,
      evaluationTime: tEval ?? '2025-03-10T12:00:00'
    });

    const standbyBusesDetails = vehicles
      .filter((v) => v.status === 'standby')
      .map((v) => ({
        busId: v.bus_id,
        registration: v.registration,
        stagedTerminal: stopMap.get(v.current_location_stop_id)?.stop_name ?? v.current_location_stop_id,
        capacity: v.capacity_total
      }));

    const maintenanceBusesDetails = vehicles
      .filter((v) => v.status === 'maintenance')
      .map((v) => ({
        busId: v.bus_id,
        location: stopMap.get(v.current_location_stop_id)?.stop_name ?? v.current_location_stop_id,
        reason: 'Reason not recorded in dataset'
      }));

    const crewShiftStatus = {
      evaluationTime: tEval,
      onShiftStandbyDrivers: standbyDrivers.onShiftStandbyDrivers.map((c) => ({
        crewId: c.crew_id,
        shift: `${c.shift_start}–${c.shift_end} (Shift ${c.shift_start === '06:00' ? '1' : '2'})`
      })),
      offShiftStandbyDrivers: standbyDrivers.offShiftStandbyDrivers.map((c) => ({
        crewId: c.crew_id,
        shift: `${c.shift_start}–${c.shift_end} (Shift ${c.shift_start === '06:00' ? '1' : '2'})`
      }))
    };

    let viewTitle = 'End-of-Day Audit';
    let viewSubtitle = 'Audited final-outcome baseline across all 86 planned service trips for 10 March 2025.';
    if (isMorning) {
      viewTitle = 'Morning Replay';
      viewSubtitle = 'As-of service replay at 08:24:00 (Morning Peak) — Bunching scenario at Marathahalli.';
    } else if (isEvening) {
      viewTitle = 'Evening Replay';
      viewSubtitle = 'As-of service replay at 18:15:00 (Evening Peak) — 1,440s service gap scenario at Hebbal.';
    }

    const currentViewData: DashboardViewData = {
      viewId: requestedView,
      viewTitle,
      viewSubtitle,
      evaluationTimestamp: tEval ?? null,
      isReplay: !isEod,

      kpis: {
        totalScheduledTrips: kpisResult.totalScheduledTrips,
        operatedTrips: kpisResult.operatedTrips,
        operatedTripsLabel: isEod ? 'Operated / Completed Trips' : 'Completed Trips So Far',
        fulfillmentRatePct: kpisResult.fulfillmentRatePct,
        cancelledTrips: kpisResult.cancelledTrips,
        cancellationRatePct: kpisResult.cancellationRatePct,
        resourceShortfallTrips: kpisResult.resourceShortfallTrips,
        resourceShortfallRatePct: kpisResult.resourceShortfallRatePct,
        combinedNonOperatedRatePct: kpisResult.combinedNonOperatedRatePct,
        replayStatus: replayStatusResult
      },

      headwaySummary: {
        available: true,
        targetPeakMinutes: Math.round(assumptions.headway.nominal_peak_headway_seconds / 60),
        targetOffpeakMinutes: Math.round(assumptions.headway.nominal_offpeak_headway_seconds / 60),
        keyStops: keyStopsData,
        otpSummary: {
          available: otp.totalKnownVisits > 0,
          totalKnownVisits: otp.totalKnownVisits,
          onTimePct: otp.onTimePct,
          latePct,
          earlyPct,
          onTimeThresholdSeconds: otp.thresholdSeconds
        }
      },

      bunchingSummary: {
        available: true,
        detectedAlerts: detectedBunchingAlerts,
        holdingRecommendation: holdingRec
      },

      serviceGapsSummary: {
        available: true,
        detectedGaps,
        reliefRecommendation: reliefRec
      },

      crowdingSummary: {
        available: true,
        totalEvaluatedVisits: validLoads.length,
        normalCount,
        overcrowdedCount,
        severelyOvercrowdedCount,
        peakOccupancyPct: peakOcc > 0 ? peakOcc : null,
        peakOnboardPassengers: peakPax > 0 ? peakPax : null,
        peakOccupancyStopName: peakOcc > 0 ? peakStop : null,
        peakOccupancyBusId: peakOcc > 0 ? peakBus : null,
        peakOccupancyTripId: peakOcc > 0 ? peakTrip : null,
        severelyOvercrowdedObservations: activeCrowdingAlerts,
        activeSeverelyOvercrowdedAlerts: activeCrowdingAlerts
      },

      fleetSummary: {
        totalVehicles: fleetInv.totalVehicles,
        activeCount: fleetInv.activeCount,
        standbyCount: fleetInv.standbyCount,
        maintenanceCount: fleetInv.maintenanceCount,
        standbyBuses: standbyBusesDetails,
        maintenanceBuses: maintenanceBusesDetails,
        crewShiftStatus,
        limitationsDisclaimer:
          'Standby deployment advisory: Transit deadhead travel time, depot clearance, and service area traffic conditions are not modeled in this release. Dispatcher manual authorization is required.'
      }
    };

    return {
      success: true,
      data: {
        currentView: currentViewData,
        availableViews: [
          {
            id: 'eod',
            title: 'End-of-Day Audit',
            timeLabel: 'Final Outcome (10 Mar 2025)',
            badge: 'Audited Baseline'
          },
          {
            id: 'morning',
            title: 'Morning Replay',
            timeLabel: '08:24:00 (Morning Peak)',
            badge: '75s Bunching Scenario'
          },
          {
            id: 'evening',
            title: 'Evening Replay',
            timeLabel: '18:15:00 (Evening Peak)',
            badge: '1,440s Gap Scenario'
          }
        ],
        datasetDate: versionInfo.date || '10 March 2025',
        corridorName: 'Silk Board–Hebbal, Bengaluru',
        datasetVersionInfo: {
          id: versionInfo.id,
          name: versionInfo.name,
          versionNumber: versionInfo.versionNumber,
          date: versionInfo.date,
          source: versionInfo.source,
          status: versionInfo.status
        }
      }
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown dashboard service error';
    return {
      success: false,
      error: {
        message: errorMsg
      }
    };
  }
}
