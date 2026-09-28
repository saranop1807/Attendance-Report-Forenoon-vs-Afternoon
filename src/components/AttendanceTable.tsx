import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  UserX,
  Trash2,
  Copy,
  Check,
} from 'lucide-react';
import { StudentRecord } from '../data/defaultAttendance';

interface AttendanceTableProps {
  students: StudentRecord[];
  activeDate: string;
  onUpdateAttendance: (rollNo: string, session: 'fn' | 'an', value: string) => void;
  onDeleteStudent: (rollNo: string) => void;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

export const AttendanceTable: React.FC<AttendanceTableProps> = ({
  students,
  activeDate,
  onUpdateAttendance,
  onDeleteStudent,
  activeFilter,
  onFilterChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedRoll, setCopiedRoll] = useState<string | null>(null);
  const [copiedBatch, setCopiedBatch] = useState(false);

  const copyRollAndName = (s: StudentRecord) => {
    navigator.clipboard.writeText(`${s.rollNo} - ${s.name || 'Unknown'}`);
    setCopiedRoll(s.rollNo);
    setTimeout(() => setCopiedRoll(null), 1500);
  };

  // Filter & Search logic
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // Search matching
      const matchesSearch =
        s.rollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      const att = s.attendance[activeDate] || { fn: '', an: '' };
      const isFnAbsent = att.fn.toUpperCase() === 'A';
      const isAnAbsent = att.an.toUpperCase() === 'A';

      switch (activeFilter) {
        case 'discrepancy':
          return (isFnAbsent && !isAnAbsent) || (!isFnAbsent && isAnAbsent);
        case 'fn_present_an_absent':
          return !isFnAbsent && isAnAbsent;
        case 'fn_absent_an_present':
          return isFnAbsent && !isAnAbsent;
        case 'both_absent':
          return isFnAbsent && isAnAbsent;
        case 'both_present':
          return !isFnAbsent && !isAnAbsent;
        case 'fn_absent':
          return isFnAbsent;
        case 'an_absent':
          return isAnAbsent;
        case 'all':
        default:
          return true;
      }
    });
  }, [students, activeDate, searchQuery, activeFilter]);

  // Compute filter badge counts
  const counts = useMemo(() => {
    let all = students.length;
    let discrepancy = 0;
    let fnPresentAnAbsent = 0;
    let fnAbsentAnPresent = 0;
    let bothAbsent = 0;
    let bothPresent = 0;

    students.forEach((s) => {
      const att = s.attendance[activeDate] || { fn: '', an: '' };
      const isFnAbsent = att.fn.toUpperCase() === 'A';
      const isAnAbsent = att.an.toUpperCase() === 'A';

      if (isFnAbsent && isAnAbsent) bothAbsent++;
      else if (!isFnAbsent && !isAnAbsent) bothPresent++;
      else if (!isFnAbsent && isAnAbsent) {
        fnPresentAnAbsent++;
        discrepancy++;
      } else if (isFnAbsent && !isAnAbsent) {
        fnAbsentAnPresent++;
        discrepancy++;
      }
    });

    return { all, discrepancy, fnPresentAnAbsent, fnAbsentAnPresent, bothAbsent, bothPresent };
  }, [students, activeDate]);

  const copyFilteredList = () => {
    const text = filteredStudents
      .map((s) => `${s.rollNo} - ${s.name || 'Unknown'}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopiedBatch(true);
    setTimeout(() => setCopiedBatch(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
      {/* Header and Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Interactive Attendance Roster ({activeDate})
            </h3>
            <p className="text-xs text-slate-500">
              Roll Numbers and Student Names are tracked side-by-side. Click{' '}
              <span className="font-bold text-red-600 bg-red-50 px-1 py-0.5 rounded border border-red-200">A</span> or{' '}
              <span className="font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200">P</span> to
              toggle session attendance.
            </p>
          </div>

          {/* Search bar & batch copy */}
          <div className="flex items-center gap-2">
            <button
              onClick={copyFilteredList}
              title="Copy current filtered students (Roll Number & Student Name)"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              {copiedBatch ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied {filteredStudents.length}!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" /> Copy List (Roll &amp; Name)
                </>
              )}
            </button>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Roll No or Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
          <span className="font-semibold text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>

          <button
            onClick={() => onFilterChange('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Students ({counts.all})
          </button>

          <button
            onClick={() => onFilterChange('discrepancy')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1 cursor-pointer ${
              activeFilter === 'discrepancy'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <AlertTriangle className="w-3 h-3" /> Discrepancies ({counts.discrepancy})
          </button>

          <button
            onClick={() => onFilterChange('fn_present_an_absent')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1 cursor-pointer ${
              activeFilter === 'fn_present_an_absent'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200'
            }`}
          >
            <UserX className="w-3 h-3" /> FN Present / AN Absent ({counts.fnPresentAnAbsent})
          </button>

          <button
            onClick={() => onFilterChange('fn_absent_an_present')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1 cursor-pointer ${
              activeFilter === 'fn_absent_an_present'
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200'
            }`}
          >
            <UserCheck className="w-3 h-3" /> FN Absent / AN Present ({counts.fnAbsentAnPresent})
          </button>

          <button
            onClick={() => onFilterChange('both_absent')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              activeFilter === 'both_absent'
                ? 'bg-red-600 text-white shadow-2xs'
                : 'bg-red-50 text-red-800 hover:bg-red-100 border border-red-200'
            }`}
          >
            Both Absent ({counts.bothAbsent})
          </button>

          <button
            onClick={() => onFilterChange('both_present')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              activeFilter === 'both_present'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            Both Present ({counts.bothPresent})
          </button>
        </div>
      </div>

      {/* Roster Table */}
      <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50 text-slate-700 font-semibold sticky top-0 z-10 border-b border-slate-200 shadow-xs">
            <tr>
              <th className="py-3 px-3 w-12 text-center text-slate-400">#</th>
              <th className="py-3 px-4 w-44">Roll Number</th>
              <th className="py-3 px-4">Student Name</th>
              <th className="py-3 px-4 text-center w-36">
                <div className="flex flex-col items-center">
                  <span className="font-bold text-slate-800">FN Session</span>
                  <span className="text-[10px] text-slate-500 font-normal">Morning</span>
                </div>
              </th>
              <th className="py-3 px-4 text-center w-36">
                <div className="flex flex-col items-center">
                  <span className="font-bold text-slate-800">AN Session</span>
                  <span className="text-[10px] text-slate-500 font-normal">Evening</span>
                </div>
              </th>
              <th className="py-3 px-4 w-56">Session Discrepancy Status</th>
              <th className="py-3 px-3 text-center w-16">Delete</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  No students found matching current filter or search criteria.
                </td>
              </tr>
            ) : (
              filteredStudents.map((student, idx) => {
                const att = student.attendance[activeDate] || { fn: '', an: '' };
                const isFnAbsent = att.fn.toUpperCase() === 'A';
                const isAnAbsent = att.an.toUpperCase() === 'A';

                // Discrepancy badge
                let statusBadge = null;
                if (!isFnAbsent && isAnAbsent) {
                  statusBadge = (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-100 text-blue-900 border border-blue-200">
                      <UserX className="w-3 h-3 text-blue-700" />
                      FN Present, AN Absent (Col 2)
                    </span>
                  );
                } else if (isFnAbsent && !isAnAbsent) {
                  statusBadge = (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-purple-100 text-purple-900 border border-purple-200">
                      <UserCheck className="w-3 h-3 text-purple-700" />
                      FN Absent, AN Present (Col 3)
                    </span>
                  );
                } else if (isFnAbsent && isAnAbsent) {
                  statusBadge = (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-red-50 text-red-700 border border-red-200">
                      Absent Both Sessions
                    </span>
                  );
                } else {
                  statusBadge = (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Present Both Sessions
                    </span>
                  );
                }

                return (
                  <tr
                    key={student.rollNo}
                    className={`hover:bg-slate-50 transition-colors ${
                      (!isFnAbsent && isAnAbsent) || (isFnAbsent && !isAnAbsent)
                        ? 'bg-amber-50/30'
                        : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                      {idx + 1}
                    </td>

                    {/* Roll Number with copy button (copies Roll No + Student Name) */}
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900">
                      <div className="flex items-center gap-1.5 group">
                        <span>{student.rollNo}</span>
                        <button
                          onClick={() => copyRollAndName(student)}
                          title="Copy Roll Number and Student Name"
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-600 p-0.5 transition-opacity cursor-pointer"
                        >
                          {copiedRoll === student.rollNo ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Student Name */}
                    <td className="py-2.5 px-4 font-bold text-slate-800">
                      {student.name || <span className="text-slate-400 italic font-normal">No name</span>}
                    </td>

                    {/* FN Cell - Red when 'A' */}
                    <td className="py-2.5 px-4 text-center">
                      <button
                        onClick={() =>
                          onUpdateAttendance(student.rollNo, 'fn', isFnAbsent ? '' : 'A')
                        }
                        title={`Click to switch FN attendance for ${student.rollNo}`}
                        className={`inline-flex items-center justify-center w-16 py-1 rounded-md text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                          isFnAbsent
                            ? 'bg-red-600 hover:bg-red-700 text-white ring-2 ring-red-400/50 shadow-sm'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300'
                        }`}
                      >
                        {isFnAbsent ? 'A (Abs)' : 'P (Pres)'}
                      </button>
                    </td>

                    {/* AN Cell - Red when 'A' */}
                    <td className="py-2.5 px-4 text-center">
                      <button
                        onClick={() =>
                          onUpdateAttendance(student.rollNo, 'an', isAnAbsent ? '' : 'A')
                        }
                        title={`Click to switch AN attendance for ${student.rollNo}`}
                        className={`inline-flex items-center justify-center w-16 py-1 rounded-md text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                          isAnAbsent
                            ? 'bg-red-600 hover:bg-red-700 text-white ring-2 ring-red-400/50 shadow-sm'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300'
                        }`}
                      >
                        {isAnAbsent ? 'A (Abs)' : 'P (Pres)'}
                      </button>
                    </td>

                    {/* Discrepancy Status Badge */}
                    <td className="py-2.5 px-4">{statusBadge}</td>

                    {/* Delete action */}
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => onDeleteStudent(student.rollNo)}
                        title="Remove student from roster"
                        className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
        <span>Showing {filteredStudents.length} of {students.length} students</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block"></span>
            <strong>Red &apos;A&apos;</strong> = Absent
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span>
            <strong>Green &apos;P&apos;</strong> = Present
          </span>
        </div>
      </div>
    </div>
  );
};
