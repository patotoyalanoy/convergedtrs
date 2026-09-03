import { useState } from 'react';
import { BarChart3, Download, Calendar, Filter } from 'lucide-react';
import { clsx } from 'clsx';

type ReportRange = 'daily' | 'weekly' | 'monthly';

export default function Reports() {
  const [range, setRange] = useState<ReportRange>('daily');

  const summaryStats = [
    { label: 'Total Time-Ins', value: '48', color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Total Time-Outs', value: '41', color: 'text-neutral-600', bg: 'bg-neutral-100' },
    { label: 'Verified On Site', value: '44', color: 'text-secondary', bg: 'bg-secondary/10' },
    { label: 'Outside Geofence', value: '4', color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Offline Records', value: '7', color: 'text-primary', bg: 'bg-primary/10' },
  ];

  const records = [
    { date: 'Aug 25, 2026', name: 'John Dela Cruz', team: 'Team Alpha', type: 'Time In', time: '08:55 AM', status: 'Verified On Site', sync: 'Synced', offline: false },
    { date: 'Aug 25, 2026', name: 'Maria Santos', team: 'Team Alpha', type: 'Time In', time: '08:50 AM', status: 'Verified On Site', sync: 'Synced', offline: false },
    { date: 'Aug 25, 2026', name: 'Eric Reyes', team: 'Team Alpha', type: 'Time Out', time: '05:02 PM', status: 'Verified On Site', sync: 'Synced', offline: true },
    { date: 'Aug 25, 2026', name: 'Ana Garcia', team: 'Team Beta', type: 'Time In', time: '08:45 AM', status: 'Outside Allowed Area', sync: 'Pending', offline: false },
    { date: 'Aug 25, 2026', name: 'Mark Dizon', team: 'Team Beta', type: 'Time In', time: '09:10 AM', status: 'Verified On Site', sync: 'Synced', offline: false },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">Attendance Reports</h1>
          <p className="text-neutral-500 mt-1">Filter, view and export attendance data</p>
        </div>
        <button className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors self-start">
          <Download size={16} /> Export Report
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-4 mb-6 flex flex-wrap gap-3 items-center">
        <div className="flex bg-neutral-100 rounded-lg p-1">
          {(['daily', 'weekly', 'monthly'] as ReportRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={clsx(
                "px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-colors",
                range === r ? "bg-white text-primary shadow-sm" : "text-neutral-500 hover:text-neutral-700"
              )}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 border border-neutral-200 rounded-lg px-3 py-2">
          <Calendar size={16} className="text-neutral-400" />
          <input type="date" className="text-sm text-neutral-700 bg-transparent outline-none" defaultValue="2026-08-25" />
        </div>
        <select className="border border-neutral-200 rounded-lg px-3 py-2 text-sm text-neutral-700 bg-white">
          <option value="">All Teams</option>
          <option>Team Alpha</option>
          <option>Team Beta</option>
          <option>Team Charlie</option>
        </select>
        <select className="border border-neutral-200 rounded-lg px-3 py-2 text-sm text-neutral-700 bg-white">
          <option value="">All Sites</option>
          <option>Makati Tower</option>
          <option>BGC Site</option>
          <option>Ortigas Hub</option>
        </select>
        <select className="border border-neutral-200 rounded-lg px-3 py-2 text-sm text-neutral-700 bg-white">
          <option value="">All Statuses</option>
          <option>Verified On Site</option>
          <option>Outside Allowed Area</option>
        </select>
        <button className="flex items-center gap-2 border border-neutral-200 rounded-lg px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
          <Filter size={16} /> More Filters
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {summaryStats.map((s, i) => (
          <div key={i} className={clsx("rounded-xl p-4 flex flex-col gap-1", s.bg)}>
            <span className={clsx("text-2xl font-black", s.color)}>{s.value}</span>
            <span className="text-xs text-neutral-600 font-medium">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Chart Placeholder */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6 mb-6 flex items-center justify-center h-52">
        <div className="flex flex-col items-center text-neutral-400">
          <BarChart3 size={48} className="mb-2 opacity-30" />
          <p className="text-sm">Attendance Trend Chart ({range})</p>
          <p className="text-xs mt-1">Integrate Recharts or Chart.js here</p>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-neutral-50 text-neutral-600 font-semibold border-b border-neutral-200">
            <tr>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Employee</th>
              <th className="px-6 py-4">Team</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Time</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Sync</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {records.map((row, i) => (
              <tr key={i} className="hover:bg-neutral-50 transition-colors">
                <td className="px-6 py-4 text-neutral-500 whitespace-nowrap">{row.date}</td>
                <td className="px-6 py-4 font-medium text-neutral-900 whitespace-nowrap">{row.name}</td>
                <td className="px-6 py-4 text-neutral-600">{row.team}</td>
                <td className="px-6 py-4 font-medium text-primary">{row.type}</td>
                <td className="px-6 py-4 text-neutral-600">{row.time}</td>
                <td className="px-6 py-4">
                  <span className={clsx("px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap",
                    row.status === 'Verified On Site' ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                  )}>
                    {row.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className={clsx("text-xs font-medium", row.sync === 'Synced' ? "text-green-600" : "text-orange-500")}>
                      {row.sync}
                    </span>
                    {row.offline && (
                      <span className="text-[10px] bg-secondary/10 text-secondary px-1.5 py-0.5 rounded font-medium">
                        Created Offline
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-100 bg-neutral-50/50">
          <span className="text-sm text-neutral-500">Showing 1–5 of 48 records</span>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 rounded-lg border border-neutral-200 text-sm text-neutral-600 hover:bg-white disabled:opacity-40" disabled>Prev</button>
            <button className="px-3 py-1.5 rounded-lg bg-primary text-white text-sm font-medium">1</button>
            <button className="px-3 py-1.5 rounded-lg border border-neutral-200 text-sm text-neutral-600 hover:bg-white">2</button>
            <button className="px-3 py-1.5 rounded-lg border border-neutral-200 text-sm text-neutral-600 hover:bg-white">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
