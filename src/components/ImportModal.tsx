import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { parseAttendanceSheet } from '../utils/csvParser';
import { INITIAL_CSV_RAW, StudentRecord } from '../data/defaultAttendance';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportData: (students: StudentRecord[], dates: string[]) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImportData,
}) => {
  const [rawText, setRawText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [previewInfo, setPreviewInfo] = useState<{
    studentsCount: number;
    dates: string[];
  } | null>(null);

  if (!isOpen) return null;

  const handleTextChange = (text: string) => {
    setRawText(text);
    setErrorMsg('');
    if (!text.trim()) {
      setPreviewInfo(null);
      return;
    }

    try {
      const parsed = parseAttendanceSheet(text);
      if (parsed.students.length > 0) {
        setPreviewInfo({
          studentsCount: parsed.students.length,
          dates: parsed.dates,
        });
      } else {
        setPreviewInfo(null);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error parsing attendance data');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      handleTextChange(content);
    };
    reader.readAsText(file);
  };

  const handleLoadSample = () => {
    handleTextChange(INITIAL_CSV_RAW);
  };

  const handleSubmit = () => {
    if (!rawText.trim()) {
      setErrorMsg('Please paste attendance data or upload a file.');
      return;
    }

    const parsed = parseAttendanceSheet(rawText);
    if (parsed.students.length === 0) {
      setErrorMsg('No valid student rows were identified. Please check formatting.');
      return;
    }

    onImportData(parsed.students, parsed.dates);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-blue-100 text-blue-700">
              <Upload className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Import Attendance from Google Sheets
              </h3>
              <p className="text-xs text-slate-500">
                Paste copied cells from Google Sheets, CSV, or upload a sheet export
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-bold text-slate-700">
              Paste Spreadsheet Data (CSV / TSV / Tab-separated)
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleLoadSample}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
              >
                Load Provided Prompt Sheet (28/09/2026)
              </button>
              <span className="text-slate-300">|</span>
              <label className="text-xs font-semibold text-slate-700 hover:text-blue-600 cursor-pointer flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                Upload CSV
                <input
                  type="file"
                  accept=".csv,.tsv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <textarea
            rows={10}
            value={rawText}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder={`Roll Number,Student Name,28/09/2026,28/09/2026\n,,FN,AN\n,,1,2\n25211A0465,GADDAM SURYA CHANDRA,A,A\n25211A0476,Gongle Svanik Kumar,A,\n25211A0496,JEETENDRA PRASAD PEDDINTI,,A\n...`}
            className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800"
          ></textarea>

          {/* Format guide note */}
          <div className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
            <p className="font-semibold text-slate-700">How to copy from Google Sheets:</p>
            <p>1. Open your attendance spreadsheet in Google Sheets.</p>
            <p>2. Select the header and data rows with Roll Number, Student Name, FN & AN columns.</p>
            <p>3. Press <kbd className="px-1 py-0.5 bg-white border rounded">Ctrl+C</kbd> (or Cmd+C) and paste it into the box above.</p>
          </div>

          {/* Detection Preview */}
          {previewInfo && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <strong>Valid Attendance Sheet Detected:</strong> Found{' '}
                <strong>{previewInfo.studentsCount} students</strong> across dates:{' '}
                <span className="font-mono">{previewInfo.dates.join(', ')}</span>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!previewInfo}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 rounded-lg shadow-sm transition-all"
          >
            Apply Attendance Data
          </button>
        </div>
      </div>
    </div>
  );
};
