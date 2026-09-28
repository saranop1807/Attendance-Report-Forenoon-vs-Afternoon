import React, { useState } from 'react';
import {
  FileText,
  Download,
  Copy,
  Check,
  Settings2,
  ChevronDown,
  ChevronUp,
  UserX,
  Printer,
  FileCheck,
} from 'lucide-react';
import { DiscrepancyRowData, WordExportOptions } from '../utils/wordGenerator';
import { PdfExportOptions } from '../utils/pdfGenerator';
import { StudentRecord } from '../data/defaultAttendance';

interface WordReportPreviewProps {
  discrepancies: DiscrepancyRowData[];
  students: StudentRecord[];
  onExportWord: (options: WordExportOptions) => void;
  isGeneratingWord: boolean;
  onExportPdf: (options: PdfExportOptions) => void;
  isGeneratingPdf: boolean;
}

export const WordReportPreview: React.FC<WordReportPreviewProps> = ({
  discrepancies,
  students,
  onExportWord,
  isGeneratingWord,
  onExportPdf,
  isGeneratingPdf,
}) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Settings
  const [documentTitle, setDocumentTitle] = useState('STUDENT ATTENDANCE DISCREPANCY & ABSENTEES REPORT');
  const [institutionName, setInstitutionName] = useState(
    'DEPARTMENT OF ELECTRONICS & COMMUNICATION ENGINEERING'
  );
  const [departmentName, setDepartmentName] = useState('Academic Year 2026 - 2027 | B.Tech II Year');
  const [includeStudentNames, setIncludeStudentNames] = useState(true);
  const [rollFormat, setRollFormat] = useState<'comma' | 'newline' | 'numbered'>('newline');
  const [includeSummaryTable, setIncludeSummaryTable] = useState(true);
  const [includeAbsenteeList, setIncludeAbsenteeList] = useState(true);
  const [pdfOrientation, setPdfOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [notes, setNotes] = useState('Official session discrepancy and absentee record generated from Google Sheets attendance tracking.');

  const handleDownloadPdf = () => {
    onExportPdf({
      documentTitle,
      institutionName,
      departmentName,
      includeStudentNames,
      rollNumberFormat: rollFormat,
      includeSummaryTable,
      includeAbsenteeList,
      orientation: pdfOrientation,
      notes,
    });
  };

  const handleDownloadWord = () => {
    onExportWord({
      documentTitle,
      institutionName,
      departmentName,
      includeStudentNames,
      rollNumberFormat: rollFormat,
      includeSummaryTable,
      includeAbsenteeList,
      notes,
    });
  };

  const copyToClipboard = (asMarkdown: boolean) => {
    let text = '';
    if (asMarkdown) {
      text += `| Date | FN present and AN absent (Roll No & Name) | FN absent and AN present (Roll No & Name) |\n`;
      text += `| :--- | :--- | :--- |\n`;
      discrepancies.forEach((row) => {
        const col2 =
          row.fnPresentAnAbsentRolls.length > 0
            ? row.fnPresentAnAbsentRolls
                .map((r) => {
                  const s = students.find((std) => std.rollNo === r);
                  return includeStudentNames && s?.name ? `${r} (${s.name})` : r;
                })
                .join(', ')
            : 'None';
        const col3 =
          row.fnAbsentAnPresentRolls.length > 0
            ? row.fnAbsentAnPresentRolls
                .map((r) => {
                  const s = students.find((std) => std.rollNo === r);
                  return includeStudentNames && s?.name ? `${r} (${s.name})` : r;
                })
                .join(', ')
            : 'None';
        text += `| ${row.date} | ${col2} | ${col3} |\n`;
      });
    } else {
      text += `Date\tFN present and AN absent (Roll No & Name)\tFN absent and AN present (Roll No & Name)\n`;
      discrepancies.forEach((row) => {
        const col2 =
          row.fnPresentAnAbsentRolls
            .map((r) => {
              const s = students.find((std) => std.rollNo === r);
              return includeStudentNames && s?.name ? `${r} (${s.name})` : r;
            })
            .join(', ') || 'None';
        const col3 =
          row.fnAbsentAnPresentRolls
            .map((r) => {
              const s = students.find((std) => std.rollNo === r);
              return includeStudentNames && s?.name ? `${r} (${s.name})` : r;
            })
            .join(', ') || 'None';
        text += `${row.date}\t${col2}\t${col3}\n`;
      });
    }

    navigator.clipboard.writeText(text);
    setCopiedType(asMarkdown ? 'markdown' : 'plain');
    setTimeout(() => setCopiedType(null), 2000);
  };

  // Helper to render roll numbers and names in preview
  const renderRollList = (rolls: string[]) => {
    if (rolls.length === 0) {
      return <span className="text-slate-400 italic">None (Nil)</span>;
    }

    if (rollFormat === 'newline' || rollFormat === 'numbered') {
      return (
        <ul className={`space-y-1.5 ${rollFormat === 'numbered' ? 'list-decimal list-inside' : ''}`}>
          {rolls.map((roll, idx) => {
            const student = students.find((s) => s.rollNo === roll);
            return (
              <li key={roll} className="text-xs flex items-baseline gap-1.5 flex-wrap">
                {rollFormat === 'numbered' && <span className="text-slate-400">{idx + 1}.</span>}
                <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                  {roll}
                </span>
                {includeStudentNames && student?.name && (
                  <span className="text-slate-800 font-semibold">{student.name}</span>
                )}
              </li>
            );
          })}
        </ul>
      );
    }

    // Comma separated
    return (
      <div className="flex flex-wrap gap-2">
        {rolls.map((roll, idx) => {
          const student = students.find((s) => s.rollNo === roll);
          return (
            <span
              key={roll}
              className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded bg-blue-50/90 text-slate-800 border border-blue-200/90 shadow-2xs hover:bg-blue-100 transition-colors"
            >
              <strong className="font-mono text-blue-950 font-bold">{roll}</strong>
              {includeStudentNames && student?.name && (
                <span className="font-medium text-slate-700">({student.name})</span>
              )}
              {idx < rolls.length - 1 && <span className="text-slate-400">,</span>}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-red-100 text-red-700">
                <FileText className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  Table Report Preview &amp; Download
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-red-100 text-red-700 border border-red-200">
                    PDF Supported
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  Export directly as a formatted vector <strong>PDF</strong> document or Microsoft Word (.docx) file.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors cursor-pointer"
            >
              <Settings2 className="w-4 h-4 text-slate-600" />
              Settings
              {showSettings ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            <button
              onClick={() => copyToClipboard(false)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              {copiedType === 'plain' ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-500" />
                  Copy Table
                </>
              )}
            </button>

            {/* Primary Action: DOWNLOAD PDF */}
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-50 rounded-lg shadow-md shadow-red-500/25 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              {isGeneratingPdf ? 'Generating PDF...' : 'Download as PDF (.pdf)'}
            </button>

            {/* Word DOCX Button */}
            <button
              onClick={handleDownloadWord}
              disabled={isGeneratingWord}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-300 disabled:opacity-50 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <FileCheck className="w-4 h-4 text-blue-600" />
              {isGeneratingWord ? 'Building Word...' : 'Download Word (.docx)'}
            </button>
          </div>
        </div>

        {/* Collapsible Document Settings */}
        {showSettings && (
          <div className="mt-5 pt-5 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Document Title</label>
              <input
                type="text"
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Institution / College Name
              </label>
              <input
                type="text"
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Department / Session
              </label>
              <input
                type="text"
                value={departmentName}
                onChange={(e) => setDepartmentName(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Roll Number &amp; Name Format
              </label>
              <select
                value={rollFormat}
                onChange={(e) => setRollFormat(e.target.value as any)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:ring-1 focus:ring-blue-500"
              >
                <option value="newline">Each Student on New Line (Cleanest)</option>
                <option value="numbered">Numbered List (1., 2., 3.)</option>
                <option value="comma">Comma-separated List</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                PDF Page Orientation
              </label>
              <select
                value={pdfOrientation}
                onChange={(e) => setPdfOrientation(e.target.value as any)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:ring-1 focus:ring-blue-500"
              >
                <option value="portrait">Portrait (Standard A4)</option>
                <option value="landscape">Landscape (Wide Table)</option>
              </select>
            </div>

            <div className="flex flex-col justify-end space-y-2">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-blue-900 bg-blue-50/50 p-2 rounded border border-blue-200">
                <input
                  type="checkbox"
                  checked={includeStudentNames}
                  onChange={(e) => setIncludeStudentNames(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                Include Student Names alongside Roll Numbers
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={includeAbsenteeList}
                  onChange={(e) => setIncludeAbsenteeList(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                Include Complete Absentees Roster in PDF/Word
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={includeSummaryTable}
                  onChange={(e) => setIncludeSummaryTable(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                Append Summary Counts Table
              </label>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Remarks / Observation Note
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes for report..."
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Realistic Document Page Simulation (PDF / Word) */}
      <div className="bg-slate-100 p-4 sm:p-8 rounded-2xl border border-slate-200 shadow-inner flex justify-center">
        <div className="w-full max-w-4xl bg-white shadow-xl rounded-lg border border-slate-300 p-8 sm:p-12 text-slate-900 font-sans transition-all">
          {/* Header of Doc */}
          <div className="text-center pb-6 border-b border-slate-200 mb-6">
            {institutionName && (
              <h3 className="text-sm font-bold tracking-wider text-blue-900 uppercase">
                {institutionName}
              </h3>
            )}
            {departmentName && <p className="text-xs text-slate-600 mt-0.5">{departmentName}</p>}
            <h2 className="text-base font-extrabold text-slate-900 mt-3 uppercase tracking-tight">
              {documentTitle}
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-xl mx-auto">
              Automated Session Discrepancy &amp; Absentees Tracking (Forenoon FN vs. Afternoon AN)
            </p>
          </div>

          {/* Section 1 Header */}
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900">
              1. Session Attendance Discrepancy Table
            </h3>
            <span className="text-[11px] text-slate-500 italic">
              Showing Roll Numbers {includeStudentNames ? '& Student Names' : ''}
            </span>
          </div>

          {/* Requested 3-Column Table */}
          <div className="overflow-x-auto rounded-lg border border-slate-300 shadow-xs mb-8">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-blue-900 text-white border-b border-blue-950 text-xs font-bold uppercase tracking-wider">
                  <th className="py-3 px-4 w-28 text-center border-r border-blue-800">
                    1. Date
                  </th>
                  <th className="py-3 px-4 w-1/2 border-r border-blue-800">
                    <div className="flex flex-col">
                      <span>2. FN present and AN absent</span>
                      <span className="text-[10px] text-blue-200 font-normal">
                        Roll Numbers &amp; Student Names
                      </span>
                    </div>
                  </th>
                  <th className="py-3 px-4 w-1/2">
                    <div className="flex flex-col">
                      <span>3. FN absent and AN present</span>
                      <span className="text-[10px] text-blue-200 font-normal">
                        Roll Numbers &amp; Student Names
                      </span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {discrepancies.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-slate-400">
                      No attendance data available to display.
                    </td>
                  </tr>
                ) : (
                  discrepancies.map((row, idx) => {
                    const isEven = idx % 2 === 0;
                    return (
                      <tr
                        key={row.date}
                        className={isEven ? 'bg-slate-50/70 hover:bg-blue-50/40' : 'bg-white hover:bg-blue-50/40'}
                      >
                        {/* 1. Date Column */}
                        <td className="py-4 px-4 font-mono font-bold text-slate-800 text-center border-r border-slate-200 align-top whitespace-nowrap">
                          {row.date}
                        </td>

                        {/* 2. FN Present and AN Absent Column */}
                        <td className="py-4 px-4 border-r border-slate-200 align-top">
                          <div className="mb-2 text-[11px] font-semibold text-blue-700 flex items-center justify-between">
                            <span>Students present in FN, absent in AN:</span>
                            <span className="font-mono text-slate-500">
                              (Count: {row.fnPresentAnAbsentRolls.length})
                            </span>
                          </div>
                          <div>{renderRollList(row.fnPresentAnAbsentRolls)}</div>
                        </td>

                        {/* 3. FN Absent and AN Present Column */}
                        <td className="py-4 px-4 align-top">
                          <div className="mb-2 text-[11px] font-semibold text-purple-700 flex items-center justify-between">
                            <span>Students absent in FN, present in AN:</span>
                            <span className="font-mono text-slate-500">
                              (Count: {row.fnAbsentAnPresentRolls.length})
                            </span>
                          </div>
                          <div>{renderRollList(row.fnAbsentAnPresentRolls)}</div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Section 2: Complete Absentees Roster in Preview */}
          {includeAbsenteeList && (
            <div className="mb-8 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-red-900 flex items-center gap-1.5">
                  <UserX className="w-4 h-4 text-red-600" />
                  2. Complete Absentees Roster (Roll Numbers &amp; Student Names)
                </h4>
                <span className="text-[11px] text-slate-500">
                  Included in exported PDF and Word document
                </span>
              </div>

              {discrepancies.map((dRow) => {
                const date = dRow.date;
                const allAbsenteesForDate = students.filter((s) => {
                  const att = s.attendance[date];
                  return att && (att.fn.toUpperCase() === 'A' || att.an.toUpperCase() === 'A');
                });

                return (
                  <div key={date} className="rounded-lg border border-red-200 overflow-hidden mb-4">
                    <div className="bg-red-50/80 px-4 py-2 border-b border-red-200 flex items-center justify-between text-xs">
                      <span className="font-bold text-red-950">Date: {date}</span>
                      <span className="font-semibold text-red-700">
                        Total Absentees: {allAbsenteesForDate.length} students
                      </span>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 sticky top-0">
                          <tr>
                            <th className="py-2 px-3 w-12 text-center">#</th>
                            <th className="py-2 px-3 w-36">Roll Number</th>
                            <th className="py-2 px-3">Student Name</th>
                            <th className="py-2 px-3 text-center w-36">Absent Session</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {allAbsenteesForDate.map((s, idx) => {
                            const att = s.attendance[date] || { fn: '', an: '' };
                            const fnAbs = att.fn.toUpperCase() === 'A';
                            const anAbs = att.an.toUpperCase() === 'A';
                            let sessionBadge = 'Both (FN & AN)';
                            let badgeClass = 'bg-red-100 text-red-800 border-red-200';

                            if (fnAbs && !anAbs) {
                              sessionBadge = 'Morning (FN) Only';
                              badgeClass = 'bg-purple-100 text-purple-800 border-purple-200';
                            } else if (!fnAbs && anAbs) {
                              sessionBadge = 'Evening (AN) Only';
                              badgeClass = 'bg-blue-100 text-blue-800 border-blue-200';
                            }

                            return (
                              <tr key={s.rollNo} className="hover:bg-slate-50">
                                <td className="py-1.5 px-3 text-center text-slate-400 font-mono">
                                  {idx + 1}
                                </td>
                                <td className="py-1.5 px-3 font-mono font-bold text-slate-900">
                                  {s.rollNo}
                                </td>
                                <td className="py-1.5 px-3 font-medium text-slate-800">
                                  {s.name || 'Unknown'}
                                </td>
                                <td className="py-1.5 px-3 text-center">
                                  <span
                                    className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${badgeClass}`}
                                  >
                                    {sessionBadge}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Section 3: Summary Table if selected */}
          {includeSummaryTable && discrepancies.length > 0 && (
            <div className="mb-6 pt-4 border-t border-slate-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                3. Discrepancy Summary Statistics
              </h4>
              <table className="w-full text-xs text-left border border-slate-200">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3 text-center">FN Present &amp; AN Absent</th>
                    <th className="py-2 px-3 text-center">FN Absent &amp; AN Present</th>
                    <th className="py-2 px-3 text-center">Total Anomaly Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {discrepancies.map((d) => (
                    <tr key={d.date} className="bg-white">
                      <td className="py-2 px-3 font-semibold">{d.date}</td>
                      <td className="py-2 px-3 text-center text-blue-700 font-bold">
                        {d.fnPresentAnAbsentRolls.length}
                      </td>
                      <td className="py-2 px-3 text-center text-purple-700 font-bold">
                        {d.fnAbsentAnPresentRolls.length}
                      </td>
                      <td className="py-2 px-3 text-center font-extrabold text-slate-900">
                        {d.fnPresentAnAbsentRolls.length + d.fnAbsentAnPresentRolls.length}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Notes & Summary in Preview */}
          {notes && (
            <div className="mt-4 p-3 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-600">
              <strong className="text-slate-800">Note:</strong> {notes}
            </div>
          )}

          {/* Footer signature line in preview */}
          <div className="mt-12 flex justify-between items-end text-xs text-slate-500 pt-6 border-t border-slate-100">
            <div>
              <span>Generated on: {new Date().toLocaleDateString()}</span>
            </div>
            <div className="text-right">
              <div className="w-48 border-b border-slate-400 mb-1"></div>
              <span className="font-medium text-slate-700">Faculty / Class In-charge Signature</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
