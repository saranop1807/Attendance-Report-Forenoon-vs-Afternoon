import { StudentRecord } from '../data/defaultAttendance';

export interface ParsedAttendanceResult {
  students: StudentRecord[];
  dates: string[];
  sessionColumns: Record<string, { fnColIndex: number; anColIndex: number }>;
  warnings: string[];
}

/**
 * Splits CSV/TSV lines taking quotes into account
 */
function parseCSVLine(line: string, delimiter: string = ','): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' || char === "'") {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export function parseAttendanceSheet(rawText: string): ParsedAttendanceResult {
  const warnings: string[] = [];
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    return {
      students: [],
      dates: [],
      sessionColumns: {},
      warnings: ['Input content is too short to contain attendance records.'],
    };
  }

  // Detect delimiter: tab or comma
  const firstFew = lines.slice(0, 4).join('\n');
  const commaCount = (firstFew.match(/,/g) || []).length;
  const tabCount = (firstFew.match(/\t/g) || []).length;
  const delimiter = tabCount > commaCount ? '\t' : ',';

  // Parse all rows
  const parsedRows = lines.map((line) => parseCSVLine(line, delimiter));

  // Determine headers
  // Often row 0: Roll Number, Student Name, 28/09/2026, 28/09/2026...
  // Row 1: ,,FN,AN
  // Row 2: ,,1,2
  let rollColIdx = 0;
  let nameColIdx = 1;

  // Find which row has Roll Number / Student Name
  let headerRowIdx = 0;
  for (let i = 0; i < Math.min(parsedRows.length, 5); i++) {
    const row = parsedRows[i];
    const rIdx = row.findIndex((cell) => /roll\s*(no|num|number)?/i.test(cell));
    const nIdx = row.findIndex((cell) => /name|student/i.test(cell));
    if (rIdx !== -1 || nIdx !== -1) {
      headerRowIdx = i;
      if (rIdx !== -1) rollColIdx = rIdx;
      if (nIdx !== -1) nameColIdx = nIdx;
      break;
    }
  }

  // Check subheaders for FN / AN
  let sessionRowIdx = -1;
  for (let i = headerRowIdx; i < Math.min(parsedRows.length, headerRowIdx + 4); i++) {
    const row = parsedRows[i];
    if (row.some((cell) => /^(FN|AN|FORENOON|AFTERNOON|MORNING|EVENING)$/i.test(cell.trim()))) {
      sessionRowIdx = i;
      break;
    }
  }

  // Map dates and session columns
  // Dates can be found in headerRowIdx or surrounding rows
  const dateCandidatesRow = parsedRows[headerRowIdx];
  const sessionRow = sessionRowIdx !== -1 ? parsedRows[sessionRowIdx] : null;

  // Find date columns
  // A date could be e.g. "28/09/2026", "28-09-2026", "2026-09-28", "28/09", or any date-like token
  const dateRegex = /\b\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}\b|\b\d{1,2}[-/.]\d{1,2}\b/;
  const detectedDates: string[] = [];
  const dateToColIndices: Record<string, number[]> = {};

  // Scan columns starting after nameColIdx
  const startCol = Math.max(rollColIdx, nameColIdx) + 1;
  const maxCols = Math.max(...parsedRows.map((r) => r.length));

  let lastSeenDate = '28/09/2026';

  for (let c = startCol; c < maxCols; c++) {
    // Check cell in headerRow
    const headerCell = dateCandidatesRow?.[c]?.trim();
    if (headerCell && dateRegex.test(headerCell)) {
      lastSeenDate = headerCell;
    }

    // Check if this column has attendance marks or session labels
    const sessionLabel = sessionRow?.[c]?.trim() || '';
    const hasSessionIndicator = /FN|AN|1|2|FORENOON|AFTERNOON/i.test(sessionLabel);

    // If there is a session label or some data further down, associate with lastSeenDate
    if (sessionLabel || (dateCandidatesRow && dateCandidatesRow[c])) {
      if (!dateToColIndices[lastSeenDate]) {
        dateToColIndices[lastSeenDate] = [];
        if (!detectedDates.includes(lastSeenDate)) {
          detectedDates.push(lastSeenDate);
        }
      }
      dateToColIndices[lastSeenDate].push(c);
    }
  }

  // Fallback: If no dates found, create a default date e.g. "28/09/2026"
  if (detectedDates.length === 0) {
    const defaultDate = '28/09/2026';
    detectedDates.push(defaultDate);
    dateToColIndices[defaultDate] = [startCol, startCol + 1];
  }

  // Configure session columns for each date
  const sessionColumns: Record<string, { fnColIndex: number; anColIndex: number }> = {};

  for (const dt of detectedDates) {
    const cols = dateToColIndices[dt] || [];
    let fnCol = cols[0] ?? startCol;
    let anCol = cols[1] ?? startCol + 1;

    // Verify against sessionRow if available
    if (sessionRow) {
      for (const col of cols) {
        const val = sessionRow[col]?.trim().toUpperCase();
        if (val === 'FN' || val === '1' || val === 'MORNING' || val === 'FORENOON') {
          fnCol = col;
        } else if (val === 'AN' || val === '2' || val === 'EVENING' || val === 'AFTERNOON') {
          anCol = col;
        }
      }
    }

    sessionColumns[dt] = { fnColIndex: fnCol, anColIndex: anCol };
  }

  // Parse student records
  // Student records start after headerRowIdx and sessionRowIdx
  const firstDataRowIdx = Math.max(headerRowIdx, sessionRowIdx) + 1;
  const students: StudentRecord[] = [];

  for (let i = firstDataRowIdx; i < parsedRows.length; i++) {
    const row = parsedRows[i];
    const rollRaw = row[rollColIdx]?.trim() || '';
    const nameRaw = row[nameColIdx]?.trim() || '';

    // Check if line is empty or purely summary (like ,,52,49 or 20.00, 24.62)
    if (!rollRaw && !nameRaw) continue;

    // Check if this row is a summary footer (e.g. Total, Percentage, pure numeric)
    if (
      /^(total|percentage|avg|average|present|absent|count)$/i.test(rollRaw) ||
      /^(total|percentage|avg|average)$/i.test(nameRaw) ||
      (rollRaw.length < 4 && !nameRaw)
    ) {
      continue;
    }

    // Must look like a valid student row (has roll number or name)
    const attendance: Record<string, { fn: string; an: string }> = {};

    for (const dt of detectedDates) {
      const { fnColIndex, anColIndex } = sessionColumns[dt];
      const fnVal = row[fnColIndex]?.trim().toUpperCase() || '';
      const anVal = row[anColIndex]?.trim().toUpperCase() || '';

      // Normalize: If it's "A" or "ABSENT", mark as "A"
      // If empty, "P", "PRESENT", "1", mark as "" (Present)
      const fnMark = fnVal === 'A' || fnVal === 'ABSENT' ? 'A' : fnVal === 'P' ? 'P' : fnVal === '' ? '' : fnVal;
      const anMark = anVal === 'A' || anVal === 'ABSENT' ? 'A' : anVal === 'P' ? 'P' : anVal === '' ? '' : anVal;

      attendance[dt] = {
        fn: fnMark === 'A' ? 'A' : '',
        an: anMark === 'A' ? 'A' : '',
      };
    }

    students.push({
      rollNo: rollRaw,
      name: nameRaw,
      attendance,
    });
  }

  return {
    students,
    dates: detectedDates,
    sessionColumns,
    warnings,
  };
}
