/**
 * HOGANA — Operational Intelligence Engine
 * Time utilities and anti-lookahead timestamp comparisons.
 * 
 * Strict conventions:
 * - All internal intervals in seconds.
 * - Time windows follow start-inclusive, end-exclusive: [T_start, T_end).
 * - Anti-lookahead comparisons reject any event after T_eval.
 */

/**
 * Parses an ISO 8601 timestamp string (YYYY-MM-DDTHH:mm:ss) into unix milliseconds.
 * Treats timestamp as UTC to avoid local timezone offset skews.
 */
export function parseIsoToMs(isoString: string): number {
  if (!isoString) {
    return NaN;
  }
  // Ensure UTC interpretation by appending Z if not present
  const normalized = isoString.endsWith('Z') ? isoString : `${isoString}Z`;
  return new Date(normalized).getTime();
}

/**
 * Parses an ISO timestamp into unix seconds (integer).
 */
export function parseIsoToSeconds(isoString: string): number {
  const ms = parseIsoToMs(isoString);
  if (isNaN(ms)) {
    return NaN;
  }
  return Math.floor(ms / 1000);
}

/**
 * Returns difference in seconds: later - earlier.
 * Returns null if either timestamp is null, invalid or unparsable.
 */
export function diffSeconds(earlierIso: string | null | undefined, laterIso: string | null | undefined): number | null {
  if (!earlierIso || !laterIso) {
    return null;
  }
  const tEarlier = parseIsoToSeconds(earlierIso);
  const tLater = parseIsoToSeconds(laterIso);
  if (isNaN(tEarlier) || isNaN(tLater)) {
    return null;
  }
  return tLater - tEarlier;
}

/**
 * Checks if a timestamp falls within a start-inclusive, end-exclusive window: [startIso, endIso).
 */
export function isWithinWindow(timestampIso: string, startIso: string, endIso: string): boolean {
  const t = parseIsoToSeconds(timestampIso);
  const tStart = parseIsoToSeconds(startIso);
  const tEnd = parseIsoToSeconds(endIso);
  if (isNaN(t) || isNaN(tStart) || isNaN(tEnd)) {
    return false;
  }
  return t >= tStart && t < tEnd;
}

/**
 * Checks if timestamp1 is strictly before or at timestamp2 (t1 <= t2).
 */
export function isAtOrBefore(timestamp1: string, timestamp2: string): boolean {
  const t1 = parseIsoToSeconds(timestamp1);
  const t2 = parseIsoToSeconds(timestamp2);
  if (isNaN(t1) || isNaN(t2)) {
    return false;
  }
  return t1 <= t2;
}

/**
 * Checks if timestamp1 is strictly after timestamp2 (t1 > t2).
 */
export function isStrictlyAfter(timestamp1: string, timestamp2: string): boolean {
  const t1 = parseIsoToSeconds(timestamp1);
  const t2 = parseIsoToSeconds(timestamp2);
  if (isNaN(t1) || isNaN(t2)) {
    return false;
  }
  return t1 > t2;
}

/**
 * Formats seconds into a human-readable string (e.g. "12m 00s" or "75s").
 */
export function formatSeconds(totalSeconds: number): string {
  const sign = totalSeconds < 0 ? '-' : '';
  const absSec = Math.abs(totalSeconds);
  const minutes = Math.floor(absSec / 60);
  const seconds = absSec % 60;
  if (minutes === 0) {
    return `${sign}${seconds}s`;
  }
  return `${sign}${minutes}m ${seconds.toString().padStart(2, '0')}s`;
}
