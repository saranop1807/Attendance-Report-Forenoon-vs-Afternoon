import React, { useState } from 'react';
import { X, Calendar, Plus } from 'lucide-react';

interface NewDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDate: (newDate: string) => void;
  existingDates: string[];
}

export const NewDateModal: React.FC<NewDateModalProps> = ({
  isOpen,
  onClose,
  onAddDate,
  existingDates,
}) => {
  const todayStr = new Date()
    .toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
    .replace(/\//g, '/');

  const [dateValue, setDateValue] = useState(todayStr);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = dateValue.trim();
    if (!trimmed) {
      setError('Please enter a valid date');
      return;
    }
    if (existingDates.includes(trimmed)) {
      setError('This date is already present in the attendance sheet');
      return;
    }
    onAddDate(trimmed);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-blue-100 text-blue-700">
              <Calendar className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900">Add Attendance Date</h3>
              <p className="text-xs text-slate-500">
                Adds a new session pair (FN &amp; AN) to all student records
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

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Date String (DD/MM/YYYY)
            </label>
            <input
              type="text"
              value={dateValue}
              onChange={(e) => {
                setDateValue(e.target.value);
                setError('');
              }}
              placeholder="e.g. 29/09/2026"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            {error && <p className="text-xs text-red-600 mt-1 font-medium">{error}</p>}
          </div>

          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900">
            A new Forenoon (FN) and Afternoon (AN) session column will be appended to the attendance
            tracking sheet.
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Date Column
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
