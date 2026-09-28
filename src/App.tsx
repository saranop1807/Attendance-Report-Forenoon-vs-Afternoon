/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FileText,
  Table as TableIcon,
  BarChart3,
  Download,
  Upload,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { Header } from './components/Header';
import { StatsCards } from './components/StatsCards';
import { WordReportPreview } from './components/WordReportPreview';
import { AttendanceTable } from './components/AttendanceTable';
import { AnalyticsView } from './components/AnalyticsView';
import { ImportModal } from './components/ImportModal';
import { NewDateModal } from './components/NewDateModal';
import { NewStudentModal } from './components/NewStudentModal';
import { GoogleSheetSyncModal } from './components/GoogleSheetSyncModal';
import { SyncBanner } from './components/SyncBanner';
import { INITIAL_CSV_RAW, StudentRecord } from './data/defaultAttendance';
import { parseAttendanceSheet } from './utils/csvParser';
import {
  calculateDiscrepancies,
  generateWordDocumentBlob,
  downloadBlob,
  WordExportOptions,
} from './utils/wordGenerator';
import { generatePdfDocument, PdfExportOptions } from './utils/pdfGenerator';
import {
  fetchLiveSheetCsv,
  detectAttendanceChanges,
} from './utils/googleSheetsSync';

export default function App() {
  // Initialize state with default data from the prompt
  const initialParsed = useMemo(() => parseAttendanceSheet(INITIAL_CSV_RAW), []);

  const [students, setStudents] = useState<StudentRecord[]>(initialParsed.students);
  const [dates, setDates] = useState<string[]>(
    initialParsed.dates.length > 0 ? initialParsed.dates : ['28/09/2026']
  );
  const [selectedDate, setSelectedDate] = useState<string>(
    initialParsed.dates[0] || '28/09/2026'
  );

  const [activeTab, setActiveTab] = useState<'wordReport' | 'roster' | 'analytics'>('wordReport');
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // Google Sheet Link & Sync State
  const [sheetUrl, setSheetUrl] = useState<string>(() => {
    return localStorage.getItem('linked_google_sheet_url') || '';
  });
  const [isSheetLinked, setIsSheetLinked] = useState<boolean>(() => {
    return localStorage.getItem('linked_google_sheet_status') === 'true';
  });
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(true);
  const [syncInterval, setSyncInterval] = useState<number>(30); // in seconds
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastChangeSummary, setLastChangeSummary] = useState<string | null>(null);

  // Modals
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isNewDateOpen, setIsNewDateOpen] = useState(false);
  const [isNewStudentOpen, setIsNewStudentOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  // Async state & Notification toast
  const [isGeneratingWord, setIsGeneratingWord] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'alert' } | null>(
    null
  );

  const showToast = (text: string, type: 'success' | 'info' | 'alert' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Sync selectedDate if dates change
  useEffect(() => {
    if (!dates.includes(selectedDate) && dates.length > 0) {
      setSelectedDate(dates[0]);
    }
  }, [dates, selectedDate]);

  // Compute discrepancies for all dates
  const discrepancies = useMemo(() => {
    return calculateDiscrepancies(students, dates);
  }, [students, dates]);

  // Core Sync Function: Pulls live Google Sheet data, detects new dates & changes
  const performSheetSync = useCallback(
    async (manual: boolean = false) => {
      if (!sheetUrl) return;

      try {
        setIsSyncing(true);
        setSyncError(null);

        const rawCsv = await fetchLiveSheetCsv(sheetUrl);
        const parsed = parseAttendanceSheet(rawCsv);

        if (parsed.students.length === 0) {
          throw new Error('No valid student attendance data found in the linked Google Sheet.');
        }

        // Compare changes against current state
        const diff = detectAttendanceChanges(students, dates, parsed.students, parsed.dates);

        if (diff.hasChanges) {
          setStudents(parsed.students);
          setDates(parsed.dates);

          // If a new date was added, switch active date to it immediately!
          if (diff.newDatesAdded.length > 0) {
            const newestDate = diff.newDatesAdded[diff.newDatesAdded.length - 1];
            setSelectedDate(newestDate);
            showToast(`Google Sheet Updated! New date added: ${newestDate}`, 'alert');
          } else {
            showToast(`Google Sheet Synced: ${diff.summary}`);
          }
          setLastChangeSummary(diff.summary);
        } else if (manual) {
          showToast('Google Sheet is up to date (no changes detected).', 'info');
        }

        setLastSyncedAt(new Date());
      } catch (err: any) {
        console.error('Error synchronizing Google Sheet:', err);
        setSyncError(err.message || 'Failed to sync with Google Sheet');
        if (manual) {
          showToast(`Sync Error: ${err.message}`, 'alert');
        }
      } finally {
        setIsSyncing(false);
      }
    },
    [sheetUrl, students, dates]
  );

  // Background Auto-Sync Interval Timer
  useEffect(() => {
    if (!isSheetLinked || !autoSyncEnabled || !sheetUrl) return;

    // Run first sync immediately on link if not synced yet
    if (!lastSyncedAt) {
      performSheetSync(false);
    }

    const timer = setInterval(() => {
      performSheetSync(false);
    }, syncInterval * 1000);

    return () => clearInterval(timer);
  }, [isSheetLinked, autoSyncEnabled, sheetUrl, syncInterval, lastSyncedAt, performSheetSync]);

  // Handle Connect to Sheet
  const handleConnectSheet = (url: string, autoSync: boolean, interval: number) => {
    setSheetUrl(url);
    setIsSheetLinked(true);
    setAutoSyncEnabled(autoSync);
    setSyncInterval(interval);
    localStorage.setItem('linked_google_sheet_url', url);
    localStorage.setItem('linked_google_sheet_status', 'true');
    showToast('Linked to Google Sheet! Starting sync...');

    // Trigger initial fetch
    setTimeout(() => {
      performSheetSync(true);
    }, 100);
  };

  // Handle Disconnect Sheet
  const handleDisconnectSheet = () => {
    setSheetUrl('');
    setIsSheetLinked(false);
    setLastSyncedAt(null);
    setLastChangeSummary(null);
    setSyncError(null);
    localStorage.removeItem('linked_google_sheet_url');
    localStorage.removeItem('linked_google_sheet_status');
    showToast('Unlinked from Google Sheet.');
  };

  // Handler: Update Attendance cell manually
  const handleUpdateAttendance = (rollNo: string, session: 'fn' | 'an', value: string) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.rollNo !== rollNo) return s;
        const currentAtt = s.attendance[selectedDate] || { fn: '', an: '' };
        return {
          ...s,
          attendance: {
            ...s.attendance,
            [selectedDate]: {
              ...currentAtt,
              [session]: value,
            },
          },
        };
      })
    );
  };

  // Handler: Delete student
  const handleDeleteStudent = (rollNo: string) => {
    if (confirm(`Remove student ${rollNo} from attendance roster?`)) {
      setStudents((prev) => prev.filter((s) => s.rollNo !== rollNo));
      showToast(`Removed student ${rollNo}`, 'info');
    }
  };

  // Handler: Add student
  const handleAddStudent = (rollNo: string, name: string) => {
    const initialAttendance: Record<string, { fn: string; an: string }> = {};
    dates.forEach((d) => {
      initialAttendance[d] = { fn: '', an: '' };
    });

    const newStudent: StudentRecord = {
      rollNo,
      name,
      attendance: initialAttendance,
    };

    setStudents((prev) => [newStudent, ...prev]);
    showToast(`Added student ${rollNo} to roster`);
  };

  // Handler: Add date manually
  const handleAddDate = (newDate: string) => {
    setDates((prev) => [...prev, newDate]);
    setSelectedDate(newDate);
    setStudents((prev) =>
      prev.map((s) => ({
        ...s,
        attendance: {
          ...s.attendance,
          [newDate]: { fn: '', an: '' },
        },
      }))
    );
    showToast(`Added attendance date: ${newDate}`);
  };

  // Handler: Import Sheet Data manually
  const handleImportData = (newStudents: StudentRecord[], newDates: string[]) => {
    setStudents(newStudents);
    setDates(newDates);
    if (newDates.length > 0) {
      setSelectedDate(newDates[0]);
    }
    showToast(`Successfully imported ${newStudents.length} student records`);
  };

  // Handler: Reset to initial prompt data
  const handleResetData = () => {
    const parsed = parseAttendanceSheet(INITIAL_CSV_RAW);
    setStudents(parsed.students);
    setDates(parsed.dates);
    setSelectedDate(parsed.dates[0] || '28/09/2026');
    showToast('Reset to original sheet attendance data');
  };

  // Handler: Generate and download PDF Document
  const handleExportPdf = async (options?: PdfExportOptions) => {
    try {
      setIsGeneratingPdf(true);
      const mergedOptions: PdfExportOptions = {
        includeStudentNames: true,
        includeAbsenteeList: true,
        orientation: 'portrait',
        ...options,
      };
      const blob = generatePdfDocument(discrepancies, students, mergedOptions);
      const filename = `Attendance_Report_${selectedDate.replace(/\//g, '-')}.pdf`;
      downloadBlob(blob, filename);
      showToast(`PDF Document (.pdf) downloaded successfully!`);
    } catch (err: any) {
      console.error('Error generating PDF document:', err);
      alert('Failed to generate PDF: ' + err.message);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Handler: Generate and download Word Document
  const handleExportWord = async (options?: WordExportOptions) => {
    try {
      setIsGeneratingWord(true);
      const mergedOptions: WordExportOptions = {
        includeStudentNames: true,
        includeAbsenteeList: true,
        ...options,
      };
      const blob = await generateWordDocumentBlob(discrepancies, students, mergedOptions);
      const filename = `Attendance_Discrepancy_Report_${selectedDate.replace(/\//g, '-')}.docx`;
      downloadBlob(blob, filename);
      showToast(`Word Document (.docx) downloaded successfully!`);
    } catch (err: any) {
      console.error('Error generating Word document:', err);
      alert('Failed to generate Word document: ' + err.message);
    } finally {
      setIsGeneratingWord(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border animate-fade-in ${
            toastMessage.type === 'alert'
              ? 'bg-amber-900 text-amber-100 border-amber-700 ring-2 ring-amber-500/50'
              : 'bg-slate-900 text-white border-slate-700'
          }`}
        >
          <CheckCircle2
            className={`w-4 h-4 ${
              toastMessage.type === 'alert' ? 'text-amber-400' : 'text-emerald-400'
            }`}
          />
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Navigation & App Bar */}
      <Header
        onExportPdf={() => handleExportPdf()}
        isGeneratingPdf={isGeneratingPdf}
        onExportWord={() => handleExportWord()}
        isGeneratingWord={isGeneratingWord}
        onOpenImport={() => setIsImportOpen(true)}
        onOpenNewDate={() => setIsNewDateOpen(true)}
        onOpenNewStudent={() => setIsNewStudentOpen(true)}
        onResetData={handleResetData}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        isSheetLinked={isSheetLinked}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Live Sheet Auto-Sync Ribbon */}
        <SyncBanner
          isLinked={isSheetLinked}
          sheetUrl={sheetUrl}
          autoSyncEnabled={autoSyncEnabled}
          syncInterval={syncInterval}
          lastSyncedAt={lastSyncedAt}
          isSyncing={isSyncing}
          lastChangeSummary={lastChangeSummary}
          onOpenSyncModal={() => setIsSyncModalOpen(true)}
          onTriggerSync={() => performSheetSync(true)}
        />

        {/* Metric Cards Banner */}
        <StatsCards
          dates={dates}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          students={students}
          activeFilter={activeFilter}
          onFilterClick={(filter) => {
            setActiveFilter(filter);
            setActiveTab('roster');
          }}
        />

        {/* View Switcher Tabs */}
        <div className="flex border-b border-slate-200">
          <nav className="flex space-x-4">
            <button
              onClick={() => setActiveTab('wordReport')}
              className={`py-3 px-4 inline-flex items-center gap-2 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'wordReport'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <FileText className="w-4 h-4" />
              Table Preview &amp; Export
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold">
                Download PDF
              </span>
            </button>

            <button
              onClick={() => setActiveTab('roster')}
              className={`py-3 px-4 inline-flex items-center gap-2 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'roster'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <TableIcon className="w-4 h-4" />
              Attendance Sheet (A in Red)
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold">
                Interactive Grid
              </span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-3 px-4 inline-flex items-center gap-2 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'analytics'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Session Discrepancy Breakdown
            </button>
          </nav>
        </div>

        {/* Tab 1: PDF & Word Report Preview & Generation */}
        {activeTab === 'wordReport' && (
          <WordReportPreview
            discrepancies={discrepancies}
            students={students}
            onExportPdf={handleExportPdf}
            isGeneratingPdf={isGeneratingPdf}
            onExportWord={handleExportWord}
            isGeneratingWord={isGeneratingWord}
          />
        )}

        {/* Tab 2: Interactive Attendance Sheet */}
        {activeTab === 'roster' && (
          <AttendanceTable
            students={students}
            activeDate={selectedDate}
            onUpdateAttendance={handleUpdateAttendance}
            onDeleteStudent={handleDeleteStudent}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
          />
        )}

        {/* Tab 3: Session Analytics */}
        {activeTab === 'analytics' && (
          <AnalyticsView students={students} activeDate={selectedDate} />
        )}
      </main>

      {/* Modals */}
      <GoogleSheetSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        sheetUrl={sheetUrl}
        isLinked={isSheetLinked}
        autoSyncEnabled={autoSyncEnabled}
        syncInterval={syncInterval}
        lastSyncedAt={lastSyncedAt}
        isSyncing={isSyncing}
        lastError={syncError}
        onConnectSheet={handleConnectSheet}
        onDisconnectSheet={handleDisconnectSheet}
        onTriggerSync={() => performSheetSync(true)}
      />

      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportData={handleImportData}
      />

      <NewDateModal
        isOpen={isNewDateOpen}
        onClose={() => setIsNewDateOpen(false)}
        onAddDate={handleAddDate}
        existingDates={dates}
      />

      <NewStudentModal
        isOpen={isNewStudentOpen}
        onClose={() => setIsNewStudentOpen(false)}
        onAddStudent={handleAddStudent}
        existingRolls={students.map((s) => s.rollNo)}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>AttendTrack Attendance Discrepancy System &bull; Forenoon (FN) &amp; Afternoon (AN)</span>
          <span className="flex items-center gap-1 text-slate-600">
            {isSheetLinked ? 'Live Google Sheet Synchronized' : 'Standalone Sheet Mode'} &bull; Absent is &apos;A&apos; in red
          </span>
        </div>
      </footer>
    </div>
  );
}
