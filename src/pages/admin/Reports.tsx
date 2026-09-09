import { useState, useEffect } from 'react';
import { BarChart3, Download, Calendar, Filter, RefreshCw, Users, CheckCircle, AlertTriangle, WifiOff } from 'lucide-react';
import { clsx } from 'clsx';
import { fetchAllAttendanceRecords, filterRecordsByRange, DateRangeOption } from '@/services/attendanceApi';
import { exportAttendanceToCSV, FormattedAttendanceRecord } from '@/utils/exportUtils';

export default function Reports() {
  const [records, setRecords] = useState<FormattedAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [rangeOption, setRangeOption] = useState<DateRangeOption>('15days');
  const [teamFilter, setTeamFilter] = useState('');
  const [siteFilter, setSiteFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadData = async () => {
    setLoading(true);
    const data = await fetchAllAttendanceRecords();
    setRecords(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter records dynamically based on selected date range dropdown and filters
  const rangeFiltered = filterRecordsByRange(records, rangeOption);
  const filteredRecords = rangeFiltered.filter(r => {
    const matchesTeam = !teamFilter || r.teamName === teamFilter;
    const matchesSite = !siteFilter || r.siteName === siteFilter;
    const matchesStatus = !statusFilter || r.verificationStatus === statusFilter;
    return matchesTeam && matchesSite && matchesStatus;
  });

  // Calculate summary stats dynamically from filteredRecords
  const totalTimeIns = filteredRecords.filter(r => r.type === 'TIME_IN').length;
  const totalTimeOuts = filteredRecords.filter(r => r.type === 'TIME_OUT').length;
  const verifiedCount = filteredRecords.filter(r => r.verificationStatus.includes('Verified')).length;
  const outsideCount = filteredRecords.filter(r => !r.verificationStatus.includes('Verified')).length;
  const offlineCount = filteredRecords.filter(r => r.createdOffline).length;

  const summaryStats = [
    { label: 'Total Time-Ins', value: totalTimeIns, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle },
    { label: 'Total Time-Outs', value: totalTimeOuts, color: 'text-blue-600', bg: 'bg-blue-50', icon: Users },
    { label: 'Verified On Site', value: verifiedCount, color: 'text-secondary', bg: 'bg-secondary/10', icon: CheckCircle },
    { label: 'Outside Geofence', value: outsideCount, color: 'text-orange-600', bg: 'bg-orange-50', icon: AlertTriangle },
    { label: 'Offline Records', value: offlineCount, color: 'text-primary', bg: 'bg-primary/10', icon: WifiOff },
  ];

  // Unique Teams and Sites for filters
  const uniqueTeams = Array.from(new Set(records.map(r => r.teamName))).filter(Boolean);
  const uniqueSites = Array.from(new Set(records.map(r => r.siteName))).filter(Boolean);

  const handleExportCSV = () => {
    const filename = `attendance_report_${rangeOption}_${new Date().toISOString().split('T')[0]}.csv`;
    exportAttendanceToCSV(filteredRecords, filename);
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-black text-navy-900 tracking-tight">Attendance Reports</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-semibold">Generate executive reports for 15 days, 30 days, or custom periods & export to CSV</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={loadData} 
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-navy-900 hover:bg-slate-100/80 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw size={13} className={clsx(loading && "animate-spin")} />
            Refresh
          </button>
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl text-xs font-black shadow-sm transition-all active:scale-95 cursor-pointer self-start"
          >
            <Download size={15} /> Export CSV Report
          </button>
        </div>
      </div>

      {/* Filters Bar with Range Dropdown */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 mb-6 flex flex-wrap gap-3 items-center">
        {/* Date Range Dropdown */}
        <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3.5 py-2 bg-slate-50/80 shadow-2xs">
          <Calendar size={16} className="text-primary" />
          <span className="text-[10px] font-extrabold text-slate-400 uppercase">Period:</span>
          <select 
            value={rangeOption} 
            onChange={(e) => setRangeOption(e.target.value as DateRangeOption)}
            className="text-xs font-black text-navy-900 bg-transparent outline-none cursor-pointer pr-1"
          >
            <option value="15days">15 Days Report (Last 15 Days)</option>
            <option value="30days">30 Days Report (Last 30 Days)</option>
            <option value="today">Today's Report</option>
            <option value="all">All Available Records</option>
          </select>
        </div>

        {/* Team Filter */}
        <select 
          value={teamFilter} 
          onChange={(e) => setTeamFilter(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-navy-900 bg-white"
        >
          <option value="">All Teams</option>
          {uniqueTeams.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        {/* Site Filter */}
        <select 
          value={siteFilter} 
          onChange={(e) => setSiteFilter(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-navy-900 bg-white"
        >
          <option value="">All Sites</option>
          {uniqueSites.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        {/* Status Filter */}
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-navy-900 bg-white"
        >
          <option value="">All Statuses</option>
          <option value="Verified On Site">Verified On Site</option>
          <option value="Outside Allowed Area">Outside Allowed Area</option>
        </select>

        {(teamFilter || siteFilter || statusFilter) && (
          <button 
            onClick={() => { setTeamFilter(''); setSiteFilter(''); setStatusFilter(''); }} 
            className="text-xs text-primary font-black hover:underline"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 mb-6">
        {summaryStats.map((s, i) => (
          <div key={i} className={clsx("rounded-2xl p-4 flex flex-col gap-1.5 border border-slate-200/80 shadow-2xs", s.bg)}>
            <div className="flex justify-between items-center">
              <span className={clsx("text-2xl font-black", s.color)}>{s.value}</span>
              <s.icon size={18} className={s.color} />
            </div>
            <span className="text-[11px] text-navy-900 font-extrabold">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Chart Visualizer Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 mb-6 flex flex-col items-center justify-center h-44 text-center">
        <BarChart3 size={38} className="mb-2 text-navy-900" />
        <h3 className="font-extrabold text-navy-900 text-sm">
          Attendance Analytics Summary ({rangeOption === '15days' ? 'Last 15 Days' : rangeOption === '30days' ? 'Last 30 Days' : rangeOption === 'today' ? 'Today' : 'All Time'})
        </h3>
        <p className="text-xs text-slate-500 font-semibold mt-1">
          Showing {totalTimeIns} Time-Ins and {totalTimeOuts} Time-Outs across {uniqueTeams.length} teams.
        </p>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-x-auto">
        {loading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-2 font-medium">
            <RefreshCw size={24} className="animate-spin text-primary" />
            <span>Loading Supabase attendance report data...</span>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-medium">
            No attendance records found within the selected {rangeOption === '15days' ? '15-day' : rangeOption === '30days' ? '30-day' : 'specified'} period.
          </div>
        ) : (
          <table className="w-full min-w-[750px] text-sm text-left">
            <thead className="bg-[#0B192C] text-white font-extrabold border-b border-navy-800 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Team</th>
                <th className="px-6 py-4">Site</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Time</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Sync</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((row) => (
                <tr key={row.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-6 py-4 text-neutral-500 whitespace-nowrap">{row.formattedDate}</td>
                  <td className="px-6 py-4 font-medium text-neutral-900 whitespace-nowrap">
                    <div>{row.employeeName}</div>
                    <div className="text-xs text-neutral-400 font-normal">{row.role || 'Technician'}</div>
                  </td>
                  <td className="px-6 py-4 text-neutral-600">{row.teamName}</td>
                  <td className="px-6 py-4 text-neutral-600">{row.siteName}</td>
                  <td className="px-6 py-4 font-medium">
                    <span className={clsx(
                      "px-2.5 py-1 rounded-md text-xs font-bold",
                      row.type === 'TIME_IN' ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                    )}>
                      {row.type === 'TIME_IN' ? 'Time In' : 'Time Out'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-neutral-600 whitespace-nowrap">{row.formattedTime}</td>
                  <td className="px-6 py-4">
                    <span className={clsx("px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap",
                      row.verificationStatus.includes('Verified') ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                    )}>
                      {row.verificationStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={clsx("text-xs font-medium", row.syncStatus === 'Synced' ? "text-green-600" : "text-orange-500")}>
                        {row.syncStatus}
                      </span>
                      {row.createdOffline && (
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
        )}

        {/* Footer info */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-100 bg-neutral-50/50">
          <span className="text-sm text-neutral-500">
            Total {filteredRecords.length} record(s) fetched for {rangeOption === '15days' ? 'Last 15 Days' : rangeOption === '30days' ? 'Last 30 Days' : rangeOption === 'today' ? "Today" : 'All Time'}
          </span>
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline"
          >
            <Download size={14} /> Download CSV Report
          </button>
        </div>
      </div>
    </div>
  );
}
