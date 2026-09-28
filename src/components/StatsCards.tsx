import React from 'react';
import { Calendar, Users, AlertTriangle, ArrowRight, UserCheck, UserX, Clock } from 'lucide-react';
import { StudentRecord } from '../data/defaultAttendance';

interface StatsCardsProps {
  dates: string[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  students: StudentRecord[];
  onFilterClick?: (filterType: string) => void;
  activeFilter?: string;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  dates,
  selectedDate,
  onSelectDate,
  students,
  onFilterClick,
  activeFilter,
}) => {
  const totalStudents = students.length;

  // Compute for selectedDate
  let fnAbsentCount = 0;
  let anAbsentCount = 0;
  let fnPresentAnAbsentCount = 0;
  let fnAbsentAnPresentCount = 0;
  let bothAbsentCount = 0;
  let bothPresentCount = 0;

  const fnPresentAnAbsentStudents: StudentRecord[] = [];
  const fnAbsentAnPresentStudents: StudentRecord[] = [];

  students.forEach((s) => {
    const att = s.attendance[selectedDate] || { fn: '', an: '' };
    const fnAbs = att.fn.toUpperCase() === 'A';
    const anAbs = att.an.toUpperCase() === 'A';

    if (fnAbs) fnAbsentCount++;
    if (anAbs) anAbsentCount++;

    if (!fnAbs && anAbs) {
      fnPresentAnAbsentCount++;
      fnPresentAnAbsentStudents.push(s);
    } else if (fnAbs && !anAbs) {
      fnAbsentAnPresentCount++;
      fnAbsentAnPresentStudents.push(s);
    } else if (fnAbs && anAbs) {
      bothAbsentCount++;
    } else {
      bothPresentCount++;
    }
  });

  const totalDiscrepancies = fnPresentAnAbsentCount + fnAbsentAnPresentCount;
  const fnPresentCount = totalStudents - fnAbsentCount;
  const anPresentCount = totalStudents - anAbsentCount;

  const fnPresentPct = totalStudents > 0 ? ((fnPresentCount / totalStudents) * 100).toFixed(1) : '0';
  const anPresentPct = totalStudents > 0 ? ((anPresentCount / totalStudents) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-4">
      {/* Date Switcher and Info Ribbon */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-semibold text-slate-700">Attendance Date:</span>
          <select
            value={selectedDate}
            onChange={(e) => onSelectDate(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            {dates.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <span className="text-xs text-slate-500 hidden sm:inline">
            (FN = Forenoon / Morning, AN = Afternoon / Evening)
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 font-medium text-slate-700">
            <Users className="w-3.5 h-3.5" /> Total Roster: <strong>{totalStudents}</strong>
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-medium">
            <AlertTriangle className="w-3.5 h-3.5" /> Discrepancies:{' '}
            <strong>{totalDiscrepancies}</strong>
          </span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Morning FN Status */}
        <div
          onClick={() => onFilterClick && onFilterClick('fn_absent')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeFilter === 'fn_absent'
              ? 'ring-2 ring-red-500 bg-red-50/70 border-red-300 shadow-sm'
              : 'bg-white hover:border-red-300 border-slate-200 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500" /> Morning (FN) Absent
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
              A in Red
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-red-600">{fnAbsentCount}</span>
            <span className="text-xs text-slate-500">
              / {totalStudents} ({fnPresentPct}% Present)
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Students marked with <strong className="text-red-600">A</strong> in morning
          </p>
        </div>

        {/* Evening AN Status */}
        <div
          onClick={() => onFilterClick && onFilterClick('an_absent')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeFilter === 'an_absent'
              ? 'ring-2 ring-red-500 bg-red-50/70 border-red-300 shadow-sm'
              : 'bg-white hover:border-red-300 border-slate-200 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-500" /> Evening (AN) Absent
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
              A in Red
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-red-600">{anAbsentCount}</span>
            <span className="text-xs text-slate-500">
              / {totalStudents} ({anPresentPct}% Present)
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Students marked with <strong className="text-red-600">A</strong> in evening
          </p>
        </div>

        {/* Column 2 of Word Doc: FN Present & AN Absent */}
        <div
          onClick={() => onFilterClick && onFilterClick('fn_present_an_absent')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeFilter === 'fn_present_an_absent'
              ? 'ring-2 ring-blue-500 bg-blue-50/70 border-blue-300 shadow-sm'
              : 'bg-white hover:border-blue-300 border-slate-200 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <UserX className="w-3.5 h-3.5 text-blue-600" /> Col 2 in Word Doc
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
              Left Early
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-blue-700">
              {fnPresentAnAbsentCount}
            </span>
            <span className="text-xs font-medium text-slate-500">students</span>
          </div>
          <p className="mt-1 text-xs text-slate-600 font-medium">
            FN Present &amp; <span className="text-red-600 font-bold">AN Absent</span>
          </p>
          {fnPresentAnAbsentStudents.length > 0 && (
            <p className="mt-1 text-[11px] text-slate-500 truncate" title={fnPresentAnAbsentStudents.map(s => `${s.rollNo} (${s.name})`).join(', ')}>
              <strong className="text-slate-700">Names:</strong> {fnPresentAnAbsentStudents.map(s => s.name || s.rollNo).join(', ')}
            </p>
          )}
        </div>

        {/* Column 3 of Word Doc: FN Absent & AN Present */}
        <div
          onClick={() => onFilterClick && onFilterClick('fn_absent_an_present')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeFilter === 'fn_absent_an_present'
              ? 'ring-2 ring-purple-500 bg-purple-50/70 border-purple-300 shadow-sm'
              : 'bg-white hover:border-purple-300 border-slate-200 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-purple-600" /> Col 3 in Word Doc
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
              Came Late
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-purple-700">
              {fnAbsentAnPresentCount}
            </span>
            <span className="text-xs font-medium text-slate-500">students</span>
          </div>
          <p className="mt-1 text-xs text-slate-600 font-medium">
            <span className="text-red-600 font-bold">FN Absent</span> &amp; AN Present
          </p>
          {fnAbsentAnPresentStudents.length > 0 && (
            <p className="mt-1 text-[11px] text-slate-500 truncate" title={fnAbsentAnPresentStudents.map(s => `${s.rollNo} (${s.name})`).join(', ')}>
              <strong className="text-slate-700">Names:</strong> {fnAbsentAnPresentStudents.map(s => s.name || s.rollNo).join(', ')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
