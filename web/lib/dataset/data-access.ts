import 'server-only';

/**
 * HOGANA — Server-Side Operational Dataset Access Layer
 * 
 * Provides asynchronous, server-only data access functions for reading,
 * parsing, validating, and caching the HOGANA synthetic demonstration dataset.
 * 
 * Guarantees:
 * 1. Server-Only Protection: Cannot be imported by client components (import 'server-only').
 * 2. Validated Individual Getters: All nine individual getters route through getCompleteDataset(),
 *    guaranteeing no module reads unvalidated records.
 * 3. Safe Asynchronous Directory Resolution: Uses non-blocking fs.access to verify that ALL nine
 *    required files are present before selecting a directory. Supports both project root and web/ paths.
 * 4. Preserved Validation Details: Returns full validation reports with complete failure details
 *    and error lists without collapsing to generic loading errors.
 * 5. Robust Error Handling: Descriptive errors for missing files, corrupt CSV rows, invalid JSON,
 *    and relational/integrity constraint failures. No silent repairs.
 */

import fs from 'fs/promises';
import path from 'path';
import type {
  Route,
  Stop,
  ScheduledTrip,
  StopTime,
  PassengerLoad,
  BusPosition,
  Vehicle,
  CrewAvailability,
  DemoAssumptions,
  CompleteDataset,
  DatasetValidationResult
} from './types';
import {
  parseRoutesCsv,
  parseStopsCsv,
  parseScheduledTripsCsv,
  parseStopTimesCsv,
  parsePassengerLoadsCsv,
  parseBusPositionsCsv,
  parseVehiclesCsv,
  parseCrewAvailabilityCsv,
  parseDemoAssumptionsJson
} from './parser';
import { validateDataset } from './validator';

/**
 * The nine mandatory files required for a complete, valid demonstration dataset.
 */
export const REQUIRED_DATASET_FILES = [
  'routes.csv',
  'stops.csv',
  'scheduled_trips.csv',
  'stop_times.csv',
  'passenger_loads.csv',
  'bus_positions.csv',
  'vehicles.csv',
  'crew_availability.csv',
  'demo_assumptions.json'
] as const;

/**
 * Asynchronously verify that a directory exists and contains ALL nine required dataset files.
 * Replaces synchronous existsSync checks.
 */
async function verifyDirectoryHasAllFiles(dirPath: string): Promise<boolean> {
  try {
    await fs.access(dirPath);
    const fileChecks = REQUIRED_DATASET_FILES.map(file =>
      fs.access(path.join(dirPath, file)).then(() => true).catch(() => false)
    );
    const results = await Promise.all(fileChecks);
    return results.every(Boolean);
  } catch {
    return false;
  }
}

/**
 * Asynchronously locate the data/demo directory containing all nine required files.
 * 
 * Safety invariants:
 * - Identifies every candidate directory containing all nine required files.
 * - If multiple complete directories exist, compares their file contents byte-for-byte.
 * - If they differ, throws a descriptive error identifying the conflicting directories and files.
 * - Never silently selects an outdated or mismatched dataset.
 * - Preserves support for both project root/data/demo/ and web/data/demo/.
 */
async function resolveDataDemoDir(): Promise<string> {
  const candidates = [
    path.resolve(process.cwd(), 'data', 'demo'),
    path.resolve(process.cwd(), '..', 'data', 'demo'),
    path.resolve(__dirname, '..', '..', 'data', 'demo'),
    path.resolve(__dirname, '..', '..', '..', 'data', 'demo'),
    path.resolve(__dirname, '..', '..', '..', '..', 'data', 'demo')
  ];

  const uniqueCandidates = Array.from(new Set(candidates));
  const completeDirectories: string[] = [];

  for (const candidate of uniqueCandidates) {
    if (await verifyDirectoryHasAllFiles(candidate)) {
      completeDirectories.push(candidate);
    }
  }

  if (completeDirectories.length === 0) {
    throw new Error(
      `Failed to locate a valid operational demonstration dataset directory containing all 9 required files:\n` +
      `Required files: ${REQUIRED_DATASET_FILES.join(', ')}\n` +
      `Searched candidates:\n${uniqueCandidates.map(c => ` - ${c}`).join('\n')}`
    );
  }

  // If multiple complete directories exist, compare their file contents byte-for-byte
  if (completeDirectories.length > 1) {
    const primaryDir = completeDirectories[0];
    const conflicts: string[] = [];

    for (let i = 1; i < completeDirectories.length; i++) {
      const otherDir = completeDirectories[i];
      const differingFiles: string[] = [];

      for (const file of REQUIRED_DATASET_FILES) {
        const primaryBuf = await fs.readFile(path.join(primaryDir, file));
        const otherBuf = await fs.readFile(path.join(otherDir, file));
        if (primaryBuf.compare(otherBuf) !== 0) {
          differingFiles.push(file);
        }
      }

      if (differingFiles.length > 0) {
        conflicts.push(
          `Directory "${primaryDir}" vs "${otherDir}": differing files [${differingFiles.join(', ')}]`
        );
      }
    }

    if (conflicts.length > 0) {
      throw new Error(
        `Conflicting operational dataset directories detected. Dataset files differ across complete locations:\n` +
        conflicts.map(c => ` - ${c}`).join('\n') +
        `\nAborting to prevent silently selecting an outdated or mismatched dataset.`
      );
    }
  }

  return completeDirectories[0];
}

interface LoadedDatasetInternal {
  dataset: CompleteDataset;
  validationResult: DatasetValidationResult;
}

// In-memory cache for loaded and validated dataset
let cachedLoad: LoadedDatasetInternal | null = null;
let inFlightLoadPromise: Promise<LoadedDatasetInternal> | null = null;

/**
 * Internal async loader: reads all nine files, parses them, and executes the validation suite.
 * Uses an in-flight Promise cache so simultaneous requests share one dataset loading and validation operation.
 */
async function loadAndValidateInternal(): Promise<LoadedDatasetInternal> {
  if (cachedLoad) {
    return cachedLoad;
  }

  if (inFlightLoadPromise) {
    return inFlightLoadPromise;
  }

  inFlightLoadPromise = (async () => {
    try {
      const baseDir = await resolveDataDemoDir();

      const readPromises = REQUIRED_DATASET_FILES.map(async file => {
        const filePath = path.join(baseDir, file);
        try {
          return await fs.readFile(filePath, 'utf8');
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          throw new Error(`Data access error: unable to read dataset file "${file}" at "${filePath}": ${msg}`);
        }
      });

      const [
        routesText,
        stopsText,
        tripsText,
        stopTimesText,
        passengerLoadsText,
        busPositionsText,
        vehiclesText,
        crewText,
        assumptionsText
      ] = await Promise.all(readPromises);

      const dataset: CompleteDataset = {
        routes: parseRoutesCsv(routesText),
        stops: parseStopsCsv(stopsText),
        scheduledTrips: parseScheduledTripsCsv(tripsText),
        stopTimes: parseStopTimesCsv(stopTimesText),
        passengerLoads: parsePassengerLoadsCsv(passengerLoadsText),
        busPositions: parseBusPositionsCsv(busPositionsText),
        vehicles: parseVehiclesCsv(vehiclesText),
        crewAvailability: parseCrewAvailabilityCsv(crewText),
        assumptions: parseDemoAssumptionsJson(assumptionsText)
      };

      const validationResult = validateDataset(dataset);
      const result: LoadedDatasetInternal = { dataset, validationResult };
      cachedLoad = result;
      return result;
    } finally {
      inFlightLoadPromise = null;
    }
  })();

  return inFlightLoadPromise;
}

/**
 * Clear the in-memory dataset cache and in-flight loader (useful for testing or hot-reloading).
 */
export function clearDatasetCache(): void {
  cachedLoad = null;
  inFlightLoadPromise = null;
}

/**
 * Validate the dataset without throwing, returning the complete, detailed validation report.
 * Returns all validation check results (record counts, primary/foreign key integrity, route directions,
 * synthetic source provenance, and operational outcomes), failed checks, record counts, and error messages.
 */
export async function validateDemoDataset(): Promise<DatasetValidationResult> {
  try {
    const { validationResult } = await loadAndValidateInternal();
    return validationResult;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      valid: false,
      totalChecks: 1,
      passedChecks: 0,
      failedChecks: 1,
      checks: [{ checkName: 'Dataset File Loading', passed: false, message: msg }],
      recordCounts: {
        routes: 0,
        stops: 0,
        scheduledTrips: 0,
        stopTimes: 0,
        passengerLoads: 0,
        busPositions: 0,
        vehicles: 0,
        crewAvailability: 0
      },
      errors: [msg]
    };
  }
}

/**
 * Retrieve the complete operational dataset along with its detailed validation report.
 * Guaranteed to return both without double disk I/O through the cached internal loader.
 */
export async function getValidatedDataset(): Promise<{
  dataset: CompleteDataset;
  validationReport: DatasetValidationResult;
}> {
  const { dataset, validationResult } = await loadAndValidateInternal();
  return { dataset, validationReport: validationResult };
}

/**
 * Retrieve the complete operational dataset.
 * Reads all nine files, parses them, and validates the dataset.
 * Throws a descriptive Error identifying all failed checks if validation fails.
 */
export async function getCompleteDataset(): Promise<CompleteDataset> {
  const { dataset, validationResult } = await loadAndValidateInternal();
  if (!validationResult.valid) {
    throw new Error(
      `Operational dataset validation error (${validationResult.failedChecks} check(s) failed):\n` +
      validationResult.errors.join('\n')
    );
  }
  return dataset;
}

/**
 * Retrieve routes (routes.csv). Uses getCompleteDataset() for guaranteed validation.
 */
export async function getRoutes(): Promise<Route[]> {
  return (await getCompleteDataset()).routes;
}

/**
 * Retrieve stops (stops.csv). Uses getCompleteDataset() for guaranteed validation.
 */
export async function getStops(): Promise<Stop[]> {
  return (await getCompleteDataset()).stops;
}

/**
 * Retrieve scheduled trip slots (scheduled_trips.csv). Uses getCompleteDataset() for guaranteed validation.
 */
export async function getScheduledTrips(): Promise<ScheduledTrip[]> {
  return (await getCompleteDataset()).scheduledTrips;
}

/**
 * Retrieve stop times (stop_times.csv). Uses getCompleteDataset() for guaranteed validation.
 */
export async function getStopTimes(): Promise<StopTime[]> {
  return (await getCompleteDataset()).stopTimes;
}

/**
 * Retrieve passenger loads (passenger_loads.csv). Uses getCompleteDataset() for guaranteed validation.
 */
export async function getPassengerLoads(): Promise<PassengerLoad[]> {
  return (await getCompleteDataset()).passengerLoads;
}

/**
 * Retrieve bus position GPS telemetry (bus_positions.csv). Uses getCompleteDataset() for guaranteed validation.
 */
export async function getBusPositions(): Promise<BusPosition[]> {
  return (await getCompleteDataset()).busPositions;
}

/**
 * Retrieve vehicles master records (vehicles.csv). Uses getCompleteDataset() for guaranteed validation.
 */
export async function getVehicles(): Promise<Vehicle[]> {
  return (await getCompleteDataset()).vehicles;
}

/**
 * Retrieve crew availability (crew_availability.csv). Uses getCompleteDataset() for guaranteed validation.
 */
export async function getCrewAvailability(): Promise<CrewAvailability[]> {
  return (await getCompleteDataset()).crewAvailability;
}

/**
 * Retrieve demonstration assumptions (demo_assumptions.json). Uses getCompleteDataset() for guaranteed validation.
 */
export async function getDemoAssumptions(): Promise<DemoAssumptions> {
  return (await getCompleteDataset()).assumptions;
}
