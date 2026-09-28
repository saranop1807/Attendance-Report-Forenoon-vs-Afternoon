import { parseAttendanceSheet, ParsedAttendanceResult } from './csvParser';
import { StudentRecord } from '../data/defaultAttendance';

export interface SheetSyncStatus {
  sheetUrl: string;
  isLinked: boolean;
  autoSyncEnabled: boolean;
  syncIntervalSeconds: number;
  lastSyncedAt: Date | null;
  isSyncing: boolean;
  lastError: string | null;
  changeSummary: string | null;
}

/**
 * Extracts Google Spreadsheet ID and gid from various link formats
 */
export function extractGoogleSheetInfo(urlOrId: string): { sheetId: string; gid: string | null; exportUrl: string } | null {
  const trimmed = urlOrId.trim();
  if (!trimmed) return null;

  // Check if it's already a direct CSV URL
  if (trimmed.includes('output=csv') || trimmed.includes('format=csv') || trimmed.includes('tqx=out:csv')) {
    return {
      sheetId: 'custom',
      gid: null,
      exportUrl: trimmed,
    };
  }

  // Check for standard docs.google.com URL
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    const sheetId = match[1];
    // Check for gid in hash or query
    const gidMatch = trimmed.match(/[#&?]gid=([0-9]+)/);
    const gid = gidMatch ? gidMatch[1] : null;

    const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv${gid ? `&gid=${gid}` : ''}`;
    return {
      sheetId,
      gid,
      exportUrl,
    };
  }

  // Check if user just provided the raw Sheet ID
  if (/^[a-zA-Z0-9-_]{20,}$/.test(trimmed)) {
    return {
      sheetId: trimmed,
      gid: null,
      exportUrl: `https://docs.google.com/spreadsheets/d/${trimmed}/export?format=csv`,
    };
  }

  return null;
}

/**
 * Fetches the CSV content of a Google Sheet, trying backend proxy first, then direct fetch
 */
export async function fetchLiveSheetCsv(sheetUrl: string): Promise<string> {
  const info = extractGoogleSheetInfo(sheetUrl);
  const targetUrl = info ? info.exportUrl : sheetUrl;

  // 1. Try server proxy endpoint to avoid any CORS restrictions
  try {
    const proxyUrl = `/api/sync-sheet?url=${encodeURIComponent(targetUrl)}`;
    const res = await fetch(proxyUrl);
    if (res.ok) {
      const text = await res.text();
      if (text && text.length > 20 && !text.includes('<!DOCTYPE html>')) {
        return text;
      }
    }
  } catch (e) {
    // Proxy not available or failed, try direct fetch
  }

  // 2. Try direct fetch (works if published to web)
  try {
    const directRes = await fetch(targetUrl);
    if (directRes.ok) {
      const text = await directRes.text();
      if (text && text.length > 20 && !text.includes('<!DOCTYPE html>')) {
        return text;
      }
    }
  } catch (e) {
    // Direct fetch failed
  }

  // 3. Try alternative GViz URL if standard export was blocked
  if (info && info.sheetId !== 'custom') {
    try {
      const gvizUrl = `https://docs.google.com/spreadsheets/d/${info.sheetId}/gviz/tq?tqx=out:csv${info.gid ? `&gid=${info.gid}` : ''}`;
      const proxyUrl = `/api/sync-sheet?url=${encodeURIComponent(gvizUrl)}`;
      const res = await fetch(proxyUrl);
      if (res.ok) {
        const text = await res.text();
        if (text && text.length > 20 && !text.includes('<!DOCTYPE html>')) {
          return text;
        }
      }
    } catch (e) {
      // Ignored
    }
  }

  throw new Error(
    'Unable to fetch sheet. Please make sure the sheet is shared as "Anyone with the link can view" or published via File > Share > Publish to web as CSV.'
  );
}

/**
 * Compares old student attendance state with new attendance state
 */
export function detectAttendanceChanges(
  oldStudents: StudentRecord[],
  oldDates: string[],
  newStudents: StudentRecord[],
  newDates: string[]
): {
  hasChanges: boolean;
  newDatesAdded: string[];
  changedMarksCount: number;
  newStudentsAdded: number;
  summary: string;
} {
  const newDatesAdded = newDates.filter((d) => !oldDates.includes(d));
  let changedMarksCount = 0;
  let newStudentsAdded = 0;

  newStudents.forEach((newS) => {
    const oldS = oldStudents.find((s) => s.rollNo === newS.rollNo);
    if (!oldS) {
      newStudentsAdded++;
      return;
    }

    // Check attendance for existing dates
    oldDates.forEach((d) => {
      const oldAtt = oldS.attendance[d] || { fn: '', an: '' };
      const newAtt = newS.attendance[d] || { fn: '', an: '' };
      if (oldAtt.fn !== newAtt.fn || oldAtt.an !== newAtt.an) {
        changedMarksCount++;
      }
    });
  });

  const hasChanges = newDatesAdded.length > 0 || changedMarksCount > 0 || newStudentsAdded > 0;

  const messages: string[] = [];
  if (newDatesAdded.length > 0) {
    messages.push(`Added new date(s): ${newDatesAdded.join(', ')}`);
  }
  if (changedMarksCount > 0) {
    messages.push(`Updated ${changedMarksCount} attendance mark(s)`);
  }
  if (newStudentsAdded > 0) {
    messages.push(`Added ${newStudentsAdded} student record(s)`);
  }

  return {
    hasChanges,
    newDatesAdded,
    changedMarksCount,
    newStudentsAdded,
    summary: messages.length > 0 ? messages.join(' • ') : 'No changes detected (Sheet is up to date)',
  };
}
