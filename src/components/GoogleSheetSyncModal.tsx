import React, { useState } from 'react';
import {
  X,
  Link2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Clock,
  Radio,
  FileSpreadsheet,
  Unlink,
} from 'lucide-react';
import { extractGoogleSheetInfo } from '../utils/googleSheetsSync';

interface GoogleSheetSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  sheetUrl: string;
  isLinked: boolean;
  autoSyncEnabled: boolean;
  syncInterval: number;
  lastSyncedAt: Date | null;
  isSyncing: boolean;
  lastError: string | null;
  onConnectSheet: (url: string, autoSync: boolean, interval: number) => void;
  onDisconnectSheet: () => void;
  onTriggerSync: () => void;
}

export const GoogleSheetSyncModal: React.FC<GoogleSheetSyncModalProps> = ({
  isOpen,
  onClose,
  sheetUrl,
  isLinked,
  autoSyncEnabled,
  syncInterval,
  lastSyncedAt,
  isSyncing,
  lastError,
  onConnectSheet,
  onDisconnectSheet,
  onTriggerSync,
}) => {
  const [inputUrl, setInputUrl] = useState(sheetUrl || '');
  const [enableAuto, setEnableAuto] = useState(autoSyncEnabled);
  const [intervalSec, setIntervalSec] = useState(syncInterval || 30);
  const [validationError, setValidationError] = useState('');

  if (!isOpen) return null;

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputUrl.trim();
    if (!trimmed) {
      setValidationError('Please enter your Google Sheet URL or ID.');
      return;
    }

    const info = extractGoogleSheetInfo(trimmed);
    if (!info) {
      setValidationError(
        'Invalid Google Sheet link. Please provide a standard URL (e.g. https://docs.google.com/spreadsheets/d/...) or published CSV link.'
      );
      return;
    }

    setValidationError('');
    onConnectSheet(trimmed, enableAuto, intervalSec);
    onClose();
  };

  const handleDisconnect = () => {
    onDisconnectSheet();
    setInputUrl('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Link Live Google Sheet
              </h3>
              <p className="text-xs text-slate-500">
                Auto-track new dates and attendance edits in real-time
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleConnect} className="p-5 overflow-y-auto space-y-4">
          {/* Link Status Pill if connected */}
          {isLinked && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-emerald-900">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <div>
                  <div className="font-bold">Currently Linked &amp; Synchronizing</div>
                  <div className="text-[11px] text-emerald-700">
                    Last sync:{' '}
                    {lastSyncedAt
                      ? lastSyncedAt.toLocaleTimeString()
                      : 'Never'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onTriggerSync}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-800 bg-white hover:bg-emerald-100 border border-emerald-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  Sync Now
                </button>
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-red-700 bg-white hover:bg-red-50 border border-red-300 rounded-lg transition-colors cursor-pointer"
                >
                  <Unlink className="w-3.5 h-3.5" />
                  Unlink
                </button>
              </div>
            </div>
          )}

          {/* URL Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Google Sheet Web URL or Share Link <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => {
                  setInputUrl(e.target.value);
                  setValidationError('');
                }}
                placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
                className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
              <Link2 className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
            {validationError && (
              <p className="text-xs text-red-600 mt-1 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {validationError}
              </p>
            )}
            {lastError && !validationError && (
              <p className="text-xs text-amber-700 mt-1 font-medium bg-amber-50 p-2 rounded border border-amber-200 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" /> {lastError}
              </p>
            )}
          </div>

          {/* Auto-Sync Options */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableAuto}
                    onChange={(e) => setEnableAuto(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  Enable Background Auto-Sync
                </label>
                <p className="text-[11px] text-slate-500 mt-0.5 ml-5">
                  Automatically pulls changes and adds new date columns as they appear in the sheet
                </p>
              </div>
            </div>

            {enableAuto && (
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="font-medium text-slate-600 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> Polling Frequency:
                </span>
                <select
                  value={intervalSec}
                  onChange={(e) => setIntervalSec(Number(e.target.value))}
                  className="px-3 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value={15}>Every 15 seconds (High frequency)</option>
                  <option value={30}>Every 30 seconds (Recommended)</option>
                  <option value={60}>Every 1 minute</option>
                  <option value={120}>Every 2 minutes</option>
                </select>
              </div>
            )}
          </div>

          {/* Setup Guide */}
          <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 space-y-1.5">
            <h4 className="font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-700" /> How to enable live tracking:
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-blue-800">
              <li>
                In your Google Sheet, click the top-right <strong>Share</strong> button.
              </li>
              <li>
                Set General access to <strong>&ldquo;Anyone with the link can view&rdquo;</strong>.
              </li>
              <li>
                Alternatively, go to <strong>File &gt; Share &gt; Publish to web</strong>, select
                <strong>CSV</strong> format, and copy the link.
              </li>
              <li>Paste the link above and click <strong>&ldquo;Link &amp; Auto-Sync&rdquo;</strong>.</li>
            </ol>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-sm shadow-emerald-600/25 transition-all cursor-pointer"
            >
              <Link2 className="w-4 h-4" />
              {isLinked ? 'Update Link Settings' : 'Link & Auto-Sync'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
