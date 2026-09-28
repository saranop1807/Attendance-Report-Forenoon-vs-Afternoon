import React from 'react';
import {
  FileText,
  Download,
  Upload,
  Plus,
  RefreshCw,
  CheckCircle2,
  FileCheck,
  Link2,
} from 'lucide-react';

interface HeaderProps {
  onExportWord: () => void;
  isGeneratingWord: boolean;
  onExportPdf: () => void;
  isGeneratingPdf: boolean;
  onOpenImport: () => void;
  onOpenNewDate: () => void;
  onOpenNewStudent: () => void;
  onResetData: () => void;
  onOpenSyncModal: () => void;
  isSheetLinked: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onExportWord,
  isGeneratingWord,
  onExportPdf,
  isGeneratingPdf,
  onOpenImport,
  onOpenNewDate,
  onOpenNewStudent,
  onResetData,
  onOpenSyncModal,
  isSheetLinked,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  AttendTrack
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  FN / AN Analyzer
                </span>
                {isSheetLinked ? (
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Sheet Synced
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-red-50 text-red-700 border border-red-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> PDF Export
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Google Sheets Attendance Discrepancy Tracker &amp; Live Synchronizer
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Link Google Sheet button */}
            <button
              onClick={onOpenSyncModal}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                isSheetLinked
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
              }`}
            >
              <Link2 className="w-3.5 h-3.5" />
              {isSheetLinked ? 'Live Sheet Linked' : 'Link Google Sheet'}
            </button>

            <button
              onClick={onResetData}
              title="Reset to default provided sheet data"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              Reset
            </button>

            <button
              onClick={onOpenImport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              Paste Sheet
            </button>

            <button
              onClick={onOpenNewDate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-blue-600" />
              Add Date
            </button>

            <button
              onClick={onOpenNewStudent}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-600" />
              Add Student
            </button>

            {/* Primary Action: Download PDF */}
            <button
              onClick={onExportPdf}
              disabled={isGeneratingPdf}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-60 rounded-lg shadow-sm shadow-red-500/25 transition-all cursor-pointer"
            >
              {isGeneratingPdf ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  Download PDF
                </>
              )}
            </button>

            {/* Secondary Action: Word */}
            <button
              onClick={onExportWord}
              disabled={isGeneratingWord}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 disabled:opacity-60 border border-slate-300 rounded-lg shadow-2xs transition-all cursor-pointer"
            >
              <FileCheck className="w-3.5 h-3.5 text-blue-600" />
              Word (.docx)
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
