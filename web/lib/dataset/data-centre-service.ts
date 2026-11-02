import 'server-only';

/**
 * HOGANA — Step 3: Server-Side Data Centre Service
 * 
 * Provides validated source dataset records, file metadata, and Step 1 validation
 * reports for the Data Centre inspection portal.
 * 
 * Invariants:
 * - Uses existing validated dataset loader (getValidatedDataset).
 * - Read-only: No editing, mutation, or independent parsing.
 * - Full disclosure of synthetic provenance and 56-check validation audit.
 */

import { getValidatedDataset } from './data-access';
import type { CompleteDataset, DatasetValidationResult } from './types';

export interface DatasetFileSummary {
  fileName: string;
  fileType: 'csv' | 'json';
  recordCount: number;
  description: string;
  primaryKey: string;
  sourceLabel: string;
}

export interface DataCentreData {
  datasetName: string;
  datasetDate: string;
  corridor: string;
  validationReport: DatasetValidationResult;
  files: DatasetFileSummary[];
  records: {
    routes: CompleteDataset['routes'];
    stops: CompleteDataset['stops'];
    scheduledTrips: CompleteDataset['scheduledTrips'];
    stopTimes: CompleteDataset['stopTimes'];
    passengerLoads: CompleteDataset['passengerLoads'];
    busPositions: CompleteDataset['busPositions'];
    vehicles: CompleteDataset['vehicles'];
    crewAvailability: CompleteDataset['crewAvailability'];
    assumptions: CompleteDataset['assumptions'];
  };
}

export interface DataCentreResponse {
  success: boolean;
  data?: DataCentreData;
  error?: {
    message: string;
    validationErrors?: string[];
  };
}

export async function getDataCentreData(): Promise<DataCentreResponse> {
  try {
    const { dataset, validationReport } = await getValidatedDataset();

    const fileSummaries: DatasetFileSummary[] = [
      {
        fileName: 'routes.csv',
        fileType: 'csv',
        recordCount: dataset.routes.length,
        description: 'Single corridor route definition (Silk Board ↔ Hebbal)',
        primaryKey: 'route_id',
        sourceLabel: dataset.routes[0]?.source_label ?? 'synthetic'
      },
      {
        fileName: 'stops.csv',
        fileType: 'csv',
        recordCount: dataset.stops.length,
        description: '24 directional corridor bus stops (12 UP / 12 DOWN)',
        primaryKey: 'stop_id',
        sourceLabel: dataset.stops[0]?.source_label ?? 'synthetic'
      },
      {
        fileName: 'scheduled_trips.csv',
        fileType: 'csv',
        recordCount: dataset.scheduledTrips.length,
        description: '86 planned corridor trip slots (43 UP / 43 DOWN)',
        primaryKey: 'trip_id',
        sourceLabel: dataset.scheduledTrips[0]?.source_label ?? 'synthetic'
      },
      {
        fileName: 'stop_times.csv',
        fileType: 'csv',
        recordCount: dataset.stopTimes.length,
        description: '1,032 stop arrival/departure records (86 trips × 12 stops)',
        primaryKey: 'trip_id + stop_sequence',
        sourceLabel: dataset.stopTimes[0]?.source_label ?? 'synthetic'
      },
      {
        fileName: 'passenger_loads.csv',
        fileType: 'csv',
        recordCount: dataset.passengerLoads.length,
        description: '924 passenger flow observations (77 operated trips × 12 stops)',
        primaryKey: 'trip_id + stop_sequence',
        sourceLabel: dataset.passengerLoads[0]?.source_label ?? 'synthetic'
      },
      {
        fileName: 'bus_positions.csv',
        fileType: 'csv',
        recordCount: dataset.busPositions.length,
        description: '4,376 60-second GPS breadcrumb observations across operated trips',
        primaryKey: 'position_id',
        sourceLabel: dataset.busPositions[0]?.source_label ?? 'synthetic'
      },
      {
        fileName: 'vehicles.csv',
        fileType: 'csv',
        recordCount: dataset.vehicles.length,
        description: '13 synthetic demonstration vehicles (60 pax design capacity: 40 seated + 20 standing)',
        primaryKey: 'bus_id',
        sourceLabel: dataset.vehicles[0]?.source_label ?? 'synthetic'
      },
      {
        fileName: 'crew_availability.csv',
        fileType: 'csv',
        recordCount: dataset.crewAvailability.length,
        description: '24 synthetic driver shift records (12 Shift 1 / 12 Shift 2)',
        primaryKey: 'crew_id',
        sourceLabel: dataset.crewAvailability[0]?.source_label ?? 'synthetic'
      },
      {
        fileName: 'demo_assumptions.json',
        fileType: 'json',
        recordCount: 1,
        description: 'Operational assumptions, cost constants, geofence, and headway parameters',
        primaryKey: '_provenance',
        sourceLabel: 'synthetic'
      }
    ];

    return {
      success: true,
      data: {
        datasetName: 'Silk Board ↔ Hebbal Corridor Operational Demonstration Dataset',
        datasetDate: '10 March 2025',
        corridor: 'Silk Board ↔ Hebbal | Bengaluru (19.8 km, Outer Ring Road)',
        validationReport,
        files: fileSummaries,
        records: {
          routes: dataset.routes,
          stops: dataset.stops,
          scheduledTrips: dataset.scheduledTrips,
          stopTimes: dataset.stopTimes,
          passengerLoads: dataset.passengerLoads,
          busPositions: dataset.busPositions,
          vehicles: dataset.vehicles,
          crewAvailability: dataset.crewAvailability,
          assumptions: dataset.assumptions
        }
      }
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown dataset access error';
    return {
      success: false,
      error: {
        message: errorMsg
      }
    };
  }
}
