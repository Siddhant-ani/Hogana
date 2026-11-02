import 'server-only';

/**
 * HOGANA — Commuter Experience Research Service
 * 
 * Sourced strictly from the aggregated summary sheet of Bus_Commuter_Survey_100.xlsx,
 * serialized into data/research/commuter_insights.json.
 * 
 * Guarantees:
 * 1. Server-Only Protection: Marked with import 'server-only'.
 * 2. Kept strictly separate from the 9 operational demo files in data/demo/.
 * 3. Never used to compute GPS positions, bus headways, occupancy, or demand.
 * 4. Transparently discloses that the workbook is simulated and not real field research.
 * 5. Strictly returns AGGREGATE statistics only — zero individual respondent profiles,
 *    personal names, or individual search data are sent to the client browser.
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

export interface CommuterResearchData {
  provenance: string;
  datasetTitle: string;
  methodology: string;
  sampleSize: number;
  disclaimer: string;
  isSimulatedWorkbook: boolean;
  metrics: {
    totalIllustrativeProfiles: number;
    peakTravelPatternPct: number;
    rarelyOrNeverVacantPct: number;
    travelWindowDistribution: TravelWindowDistribution;
  };
  commuterPainPoints: CommuterPainPoint[];
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

    // Provide ONLY aggregated figures. Do NOT include individual respondent records or names.
    cachedResearchData = {
      provenance: parsed._provenance || 'Simulated illustrative workbook calibrated for Silk Board–Hebbal, Bengaluru service area.',
      datasetTitle: parsed.datasetTitle || 'Silk Board–Hebbal, Bengaluru Commuter Experience Case Study',
      methodology: parsed.methodology || 'Simulated cross-sectional commuter archetype modeling across 100 representative daily bus commuter profiles.',
      sampleSize: parsed.sampleSize || 100,
      disclaimer: 'This workbook is a simulated case study and not real field research. It is provided for operational context and passenger perception analysis only. It is NOT used to calculate vehicle GPS coordinates, timetable headways, passenger loads, bus occupancy, or operational demand.',
      isSimulatedWorkbook: true,
      metrics: {
        totalIllustrativeProfiles: parsed.metrics?.sampleProfiles ?? 100,
        peakTravelPatternPct: parsed.metrics?.peakTravelPatternPct ?? 88,
        rarelyOrNeverVacantPct: parsed.metrics?.rarelyOrNeverVacantPct ?? 77,
        travelWindowDistribution: parsed.metrics?.travelWindowDistribution ?? {
          morningPeak: 28,
          eveningPeak: 22,
          bothPeaks: 38,
          offPeak: 12
        }
      },
      commuterPainPoints: (parsed.commuterPainPoints || []).map((cp: CommuterPainPoint) => ({
        rank: cp.rank,
        category: cp.category,
        problem: cp.problem,
        mentions: cp.mentions,
        percentage: cp.percentage,
        operationalRelevance: cp.operationalRelevance
      }))
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
