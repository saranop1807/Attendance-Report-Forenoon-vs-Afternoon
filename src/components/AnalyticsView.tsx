import React, { useState } from 'react';
import {
  UserX,
  UserCheck,
  Copy,
  Check,
  Clock,
  Users,
  Search,
  AlertTriangle,
} from 'lucide-react';
import { StudentRecord } from '../data/defaultAttendance';

interface AnalyticsViewProps {
  students: StudentRecord[];
  activeDate: string;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ students, activeDate }) => {
  const [copiedGroup, setCopiedGroup] = useState<string | null>(null);
  const [absenteeSearch, setAbsenteeSearch] = useState('');
  const [activeAbsenteeTab, setActiveAbsenteeTab] = useState<'fn' | 'an' | 'both'>('fn');

  const copyRollsAndNames = (list: StudentRecord[], groupName: string) => {
    const text = list
      .map((s) => `${s.rollNo} - ${s.name || 'Unknown'}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopiedGroup(groupName);
    setTimeout(() => setCopiedGroup(null), 1800);
  };

  const copyRollsOnly = (list: StudentRecord[], groupName: string) => {
    const text = list.map((s) => s.rollNo).join(', ');
    navigator.clipboard.writeText(text);
    setCopiedGroup(`${groupName}_rolls`);
    setTimeout(() => setCopiedGroup(null), 1800);
  };

  const total = students.length;
  const fnPresentAnAbsent: StudentRecord[] = [];
  const fnAbsentAnPresent: StudentRecord[] = [];
  const fnAbsentees: StudentRecord[] = [];
  const anAbsentees: StudentRecord[] = [];
  const bothAbsent: StudentRecord[] = [];
  const bothPresent: StudentRecord[] = [];

  students.forEach((s) => {
    const att = s.attendance[activeDate] || { fn: '', an: '' };
    const fnAbs = att.fn.toUpperCase() === 'A';
    const anAbs = att.an.toUpperCase() === 'A';

    if (fnAbs) fnAbsentees.push(s);
    if (anAbs) anAbsentees.push(s);

    if (!fnAbs && anAbs) {
      fnPresentAnAbsent.push(s);
    } else if (fnAbs && !anAbs) {
      fnAbsentAnPresent.push(s);
    } else if (fnAbs && anAbs) {
      bothAbsent.push(s);
    } else {
      bothPresent.push(s);
    }
  });

  const fnPresentPct = total > 0 ? (((total - fnAbsentees.length) / total) * 100).toFixed(1) : '0';
  const anPresentPct = total > 0 ? (((total - anAbsentees.length) / total) * 100).toFixed(1) : '0';

  // Filtered absentees for the detailed roster
  const currentAbsenteeList =
    activeAbsenteeTab === 'fn'
      ? fnAbsentees
      : activeAbsenteeTab === 'an'
      ? anAbsentees
      : bothAbsent;

  const filteredAbsentees = currentAbsenteeList.filter(
    (s) =>
      s.rollNo.toLowerCase().includes(absenteeSearch.toLowerCase()) ||
      s.name.toLowerCase().includes(absenteeSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Session Comparison Meter */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* FN Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-amber-100 text-amber-700">
                <Clock className="w-5 h-5" />
              </span>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Morning Session (FN)</h4>
                <p className="text-xs text-slate-500">Forenoon attendance distribution</p>
              </div>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
              {fnAbsentees.length} Absentees
            </span>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-xs font-medium text-slate-600">
              <span>Attendance Rate</span>
              <span className="font-bold text-slate-900">{fnPresentPct}%</span>
            </div>
            <div className="h-3 w-full bg-red-100 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${fnPresentPct}%` }}
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              ></div>
            </div>
            <div className="flex justify-between text-[11px] text-slate-500">
              <span className="text-emerald-700 font-semibold">{total - fnAbsentees.length} Present</span>
              <span className="text-red-600 font-semibold">{fnAbsentees.length} Absent (&apos;A&apos;)</span>
            </div>
          </div>
        </div>

        {/* AN Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-blue-100 text-blue-700">
                <Clock className="w-5 h-5" />
              </span>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Evening Session (AN)</h4>
                <p className="text-xs text-slate-500">Afternoon attendance distribution</p>
              </div>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
              {anAbsentees.length} Absentees
            </span>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-xs font-medium text-slate-600">
              <span>Attendance Rate</span>
              <span className="font-bold text-slate-900">{anPresentPct}%</span>
            </div>
            <div className="h-3 w-full bg-red-100 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${anPresentPct}%` }}
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              ></div>
            </div>
            <div className="flex justify-between text-[11px] text-slate-500">
              <span className="text-emerald-700 font-semibold">{total - anAbsentees.length} Present</span>
              <span className="text-red-600 font-semibold">{anAbsentees.length} Absent (&apos;A&apos;)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Discrepancy Breakdown Sections (with Names & Roll Numbers) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Col 2 Discrepancy: FN Present & AN Absent */}
        <div className="bg-white rounded-2xl border border-blue-200 shadow-2xs overflow-hidden">
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50/50 border-b border-blue-200 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <UserX className="w-5 h-5 text-blue-700" />
              <div>
                <h4 className="text-sm font-bold text-blue-950">
                  FN Present &amp; AN Absent (Column 2)
                </h4>
                <p className="text-xs text-blue-700">
                  Left early: Attended morning, missed evening ({fnPresentAnAbsent.length} students)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => copyRollsAndNames(fnPresentAnAbsent, 'fn_present_an_absent')}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-blue-900 bg-white hover:bg-blue-100 border border-blue-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                {copiedGroup === 'fn_present_an_absent' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-blue-600" /> Copy Roll &amp; Names
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="p-4">
            {fnPresentAnAbsent.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">
                No students present in FN and absent in AN.
              </p>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-1 gap-2">
                  {fnPresentAnAbsent.map((s) => (
                    <div
                      key={s.rollNo}
                      className="p-3 rounded-xl bg-blue-50/60 border border-blue-200/80 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <span className="font-mono font-bold text-blue-900 text-sm">{s.rollNo}</span>
                        <div className="text-slate-800 font-bold">{s.name}</div>
                      </div>
                      <span className="text-[11px] font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded border border-red-200">
                        AN: Absent (A)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Col 3 Discrepancy: FN Absent & AN Present */}
        <div className="bg-white rounded-2xl border border-purple-200 shadow-2xs overflow-hidden">
          <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50/50 border-b border-purple-200 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-purple-700" />
              <div>
                <h4 className="text-sm font-bold text-purple-950">
                  FN Absent &amp; AN Present (Column 3)
                </h4>
                <p className="text-xs text-purple-700">
                  Came late: Missed morning, attended evening ({fnAbsentAnPresent.length} students)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => copyRollsAndNames(fnAbsentAnPresent, 'fn_absent_an_present')}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-purple-900 bg-white hover:bg-purple-100 border border-purple-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                {copiedGroup === 'fn_absent_an_present' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-purple-600" /> Copy Roll &amp; Names
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="p-4">
            {fnAbsentAnPresent.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">
                No students absent in FN and present in AN.
              </p>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-1 gap-2">
                  {fnAbsentAnPresent.map((s) => (
                    <div
                      key={s.rollNo}
                      className="p-3 rounded-xl bg-purple-50/60 border border-purple-200/80 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <span className="font-mono font-bold text-purple-900 text-sm">{s.rollNo}</span>
                        <div className="text-slate-800 font-bold">{s.name}</div>
                      </div>
                      <span className="text-[11px] font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded border border-red-200">
                        FN: Absent (A)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Complete Absentees Roster Section (With Roll Numbers & Student Names) */}
      <div className="bg-white rounded-2xl border border-red-200 shadow-2xs overflow-hidden">
        <div className="p-5 bg-gradient-to-r from-red-50 via-slate-50 to-white border-b border-red-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-lg bg-red-100 text-red-700">
                <UserX className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Detailed Absentees Roster (Roll Numbers &amp; Student Names)
                </h3>
                <p className="text-xs text-slate-500">
                  Full student names included for all absentees on {activeDate}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => copyRollsAndNames(filteredAbsentees, 'absentees_all')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                {copiedGroup === 'absentees_all' ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Copied {filteredAbsentees.length} Records!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy Roll Nos &amp; Names
                  </>
                )}
              </button>

              <button
                onClick={() => copyRollsOnly(filteredAbsentees, 'absentees_all')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                {copiedGroup === 'absentees_all_rolls' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" /> Roll Nos Only
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Subtabs & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => setActiveAbsenteeTab('fn')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                  activeAbsenteeTab === 'fn'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Morning (FN) Absentees ({fnAbsentees.length})
              </button>

              <button
                onClick={() => setActiveAbsenteeTab('an')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                  activeAbsenteeTab === 'an'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Evening (AN) Absentees ({anAbsentees.length})
              </button>

              <button
                onClick={() => setActiveAbsenteeTab('both')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                  activeAbsenteeTab === 'both'
                    ? 'bg-red-700 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Both Sessions Absent ({bothAbsent.length})
              </button>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter absentee name or roll..."
                value={absenteeSearch}
                onChange={(e) => setAbsenteeSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>
        </div>

        {/* Absentees Table */}
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 sticky top-0">
              <tr>
                <th className="py-2.5 px-3 w-12 text-center text-slate-400">#</th>
                <th className="py-2.5 px-4 w-40">Roll Number</th>
                <th className="py-2.5 px-4">Student Name</th>
                <th className="py-2.5 px-4 text-center w-28">FN Status</th>
                <th className="py-2.5 px-4 text-center w-28">AN Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAbsentees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No absentees match the criteria.
                  </td>
                </tr>
              ) : (
                filteredAbsentees.map((s, idx) => {
                  const att = s.attendance[activeDate] || { fn: '', an: '' };
                  const fnAbs = att.fn.toUpperCase() === 'A';
                  const anAbs = att.an.toUpperCase() === 'A';

                  return (
                    <tr key={s.rollNo} className="hover:bg-red-50/30">
                      <td className="py-2 px-3 text-center text-slate-400 font-mono">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-4 font-mono font-bold text-slate-900">
                        {s.rollNo}
                      </td>
                      <td className="py-2 px-4 font-bold text-slate-800">
                        {s.name || <span className="text-slate-400 italic font-normal">No name</span>}
                      </td>
                      <td className="py-2 px-4 text-center">
                        {fnAbs ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-700 border border-red-300">
                            A (Absent)
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700">
                            P (Present)
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-4 text-center">
                        {anAbs ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-700 border border-red-300">
                            A (Absent)
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700">
                            P (Present)
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
