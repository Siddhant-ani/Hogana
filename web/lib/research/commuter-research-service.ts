import 'server-only';

/**
 * HOGANA — Commuter Experience Research Service
 * 
 * Sourced strictly from the aggregated summary sheet of Bus_Commuter_Survey_100.xlsx,
 * serialized into data/research/commuter_insights.json.
 * 
 * Guarantees:
 * 1. Server-Only Protection: Marked with import 'server-only'.
 * 2. Kept strictly separate from the 9 operational demo files.
 * 3. Never used to compute GPS positions, bus headways, occupancy, or demand.
 * 4. Transparently discloses that all 100 profiles are simulated illustrative data.
 */

import fs from 'fs/promises';
import path from 'path';

export interface CommuterPainPoint {
  rank: number;
  category: string;
  problem: string;
  mentions: number;
  percentage: number;
  operationalRelevance: string;
}

export interface TravelWindowDistribution {
  morningPeak: number;
  eveningPeak: number;
  bothPeaks: number;
  offPeak: number;
}

export interface CommuterProfile {
  respondentId: number;
  name: string;
  age: number;
  gender: string;
  occupation: string;
  busFare: string;
  travelFrequency: string;
  usualTravelTime: string;
  distanceKm: string;
  problemsFaced: string;
  busFoundVacant: string;
}

export interface CommuterResearchData {
  provenance: string;
  datasetTitle: string;
  methodology: string;
  sampleSize: number;
  disclaimer: string;
  metrics: {
    sampleProfiles: number;
    peakTravelPatternPct: number;
    rarelyOrNeverVacantPct: number;
    travelWindowDistribution: TravelWindowDistribution;
  };
  commuterPainPoints: CommuterPainPoint[];
  sampleProfiles: CommuterProfile[];
}

export interface CommuterResearchResponse {
  success: boolean;
  data?: CommuterResearchData;
  error?: {
    message: string;
  };
}

let cachedResearchData: CommuterResearchData | null = null;

async function resolveResearchFile(): Promise<string> {
  const candidates = [
    path.resolve(process.cwd(), 'data', 'research', 'commuter_insights.json'),
    path.resolve(process.cwd(), '..', 'data', 'research', 'commuter_insights.json'),
    path.resolve(__dirname, '..', '..', '..', 'data', 'research', 'commuter_insights.json')
  ];

  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // check next
    }
  }

  throw new Error('Failed to locate data/research/commuter_insights.json');
}

export async function getCommuterResearchData(): Promise<CommuterResearchResponse> {
  try {
    if (cachedResearchData) {
      return { success: true, data: cachedResearchData };
    }

    const filePath = await resolveResearchFile();
    const rawContent = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(rawContent);

    cachedResearchData = {
      provenance: parsed._provenance,
      datasetTitle: parsed.datasetTitle,
      methodology: parsed.methodology,
      sampleSize: parsed.sampleSize,
      disclaimer: parsed.disclaimer,
      metrics: parsed.metrics,
      commuterPainPoints: parsed.commuterPainPoints,
      sampleProfiles: parsed.sampleProfiles || []
    };

    return {
      success: true,
      data: cachedResearchData
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error reading commuter research data';
    return {
      success: false,
      error: { message: errorMsg }
    };
  }
}
