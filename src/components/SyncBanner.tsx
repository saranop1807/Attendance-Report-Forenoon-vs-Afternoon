import React from 'react';
import {
  FileSpreadsheet,
  RefreshCw,
  Link2,
  CheckCircle2,
  AlertTriangle,
  Settings2,
  Clock,
  Sparkles,
} from 'lucide-react';

interface SyncBannerProps {
  isLinked: boolean;
  sheetUrl: string;
  autoSyncEnabled: boolean;
  syncInterval: number;
  lastSyncedAt: Date | null;
  isSyncing: boolean;
  lastChangeSummary: string | null;
  onOpenSyncModal: () => void;
  onTriggerSync: () => void;
}

export const SyncBanner: React.FC<SyncBannerProps> = ({
  isLinked,
  sheetUrl,
  autoSyncEnabled,
  syncInterval,
  lastSyncedAt,
  isSyncing,
  lastChangeSummary,
  onOpenSyncModal,
  onTriggerSync,
}) => {
  return (
    <div
      className={`rounded-2xl border transition-all ${
        isLinked
          ? 'bg-gradient-to-r from-emerald-50 via-teal-50/40 to-white border-emerald-300 shadow-xs'
          : 'bg-gradient-to-r from-blue-50/60 via-slate-50 to-white border-blue-200 shadow-2xs'
      } p-3.5 sm:p-4`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isLinked
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/25'
                : 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
            }`}
          >
            <FileSpreadsheet className="w-5 h-5" />
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-900">
                {isLinked ? 'Live Google Sheet Connected' : 'Link Your Google Sheet'}
              </span>

              {isLinked && (
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Auto-Sync Active ({syncInterval}s)
                </span>
              )}

              {lastChangeSummary && isLinked && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-semibold">
                  {lastChangeSummary}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500">
              {isLinked ? (
                <>
                  Checking Google Sheet for new dates &amp; edits. Last checked:{' '}
                  <strong className="text-slate-700">
                    {lastSyncedAt ? lastSyncedAt.toLocaleTimeString() : 'Just now'}
                  </strong>
                </>
              ) : (
                'Connect your Google Sheet URL to automatically track and update attendance whenever rows or dates are added.'
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          {isLinked && (
            <button
              onClick={onTriggerSync}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-white hover:bg-emerald-50 border border-emerald-300 rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-600' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </button>
          )}

          <button
            onClick={onOpenSyncModal}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer ${
              isLinked
                ? 'text-slate-700 bg-white hover:bg-slate-50 border border-slate-300'
                : 'text-white bg-blue-600 hover:bg-blue-700 shadow-blue-500/25'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            {isLinked ? 'Sheet Settings' : 'Link Google Sheet'}
          </button>
        </div>
      </div>
    </div>
  );
};
