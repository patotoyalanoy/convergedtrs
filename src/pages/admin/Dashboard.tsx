import { useState, useEffect } from 'react';
import { Users, LogIn, LogOut, AlertTriangle, RefreshCw, CheckCircle2, TrendingUp, Clock } from 'lucide-react';
import { clsx } from 'clsx';
import { fetchAllAttendanceRecords } from '@/services/attendanceApi';
import { FormattedAttendanceRecord } from '@/utils/exportUtils';

export default function AdminDashboard() {
  const [records, setRecords] = useState<FormattedAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    setLoading(true);
    const data = await fetchAllAttendanceRecords();
    setRecords(data);
    setLoading(false);
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const todayRecords = filterTodayRecords(records);
  const timeInTodayCount = todayRecords.filter(r => r.type === 'TIME_IN').length;
  const timeOutTodayCount = todayRecords.filter(r => r.type === 'TIME_OUT').length;
  const outsideCount = todayRecords.filter(r => !r.verificationStatus.includes('Verified')).length;
  const pendingSyncCount = records.filter(r => r.syncStatus !== 'Synced').length;
  const uniqueEmployees = new Set(records.map(r => r.employeeId || r.employeeName)).size;

  const stats = [
    { label: 'Active Employees', value: uniqueEmployees, icon: Users, color: 'text-navy-900', iconBg: 'bg-navy-50 border border-navy-100', bar: 'bg-gradient-to-r from-navy-800 to-navy-900', trend: 'Total tracked' },
    { label: 'Time In Today', value: timeInTodayCount, icon: LogIn, color: 'text-emerald-700', iconBg: 'bg-emerald-50 border border-emerald-100', bar: 'bg-gradient-to-r from-emerald-500 to-emerald-600', trend: 'Today' },
    { label: 'Time Out Today', value: timeOutTodayCount, icon: LogOut, color: 'text-sky-700', iconBg: 'bg-sky-50 border border-sky-100', bar: 'bg-gradient-to-r from-sky-500 to-sky-600', trend: 'Today' },
    { label: 'Outside Geofence', value: outsideCount, icon: AlertTriangle, color: 'text-orange-700', iconBg: 'bg-orange-50 border border-orange-100', bar: 'bg-gradient-to-r from-orange-500 to-orange-600', trend: outsideCount > 0 ? 'Needs review' : 'All clear' },
    { label: 'Pending Sync', value: pendingSyncCount, icon: RefreshCw, color: 'text-primary-dark', iconBg: 'bg-primary/10 border border-primary/20', bar: 'bg-gradient-to-r from-primary to-orange-600', trend: pendingSyncCount > 0 ? 'Needs sync' : 'All synced' },
  ];

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-navy-900 tracking-tight flex items-center gap-2">
            <span>Executive Dashboard</span>
            <span className="text-[10px] bg-navy-900 text-white font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">Converge DTRS</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-semibold flex items-center gap-1.5">
            <Clock size={12} className="text-primary" />
            {dateStr} · {timeStr}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadDashboardData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 rounded-xl text-navy-900 hover:bg-slate-100/80 text-xs font-bold shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw size={13} className={clsx(loading && 'animate-spin')} />
            Refresh
          </button>
          <input
            type="date"
            className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-navy-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
            defaultValue={new Date().toISOString().split('T')[0]}
          />
        </div>
      </div>

      {/* ── Stat Cards: 2×2 on mobile, 3 cols on md, 5 on lg ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {stats.map((stat, idx) => (
          <div key={idx} className="relative bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 flex flex-col gap-3 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            {/* Gradient accent top bar */}
            <div className={clsx('absolute top-0 inset-x-0 h-1.5 rounded-t-2xl', stat.bar)} />
            <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs', stat.iconBg, stat.color)}>
              <stat.icon size={18} />
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider leading-none mb-1">{stat.label}</p>
              <h3 className="text-3xl font-black text-navy-900 leading-none">
                {loading ? <span className="text-xl text-slate-300">—</span> : stat.value}
              </h3>
            </div>
            <p className={clsx('text-[10px] font-bold flex items-center gap-1', stat.color)}>
              <TrendingUp size={10} />
              {stat.trend}
            </p>
          </div>
        ))}
      </div>

      {/* ── Bottom Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Attendance Summary */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="font-black text-navy-900 text-sm">Today's Attendance Status</h2>
                <p className="text-[11px] text-slate-500 font-medium">Real-time status breakdown for Converge field staff</p>
              </div>
              <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/80 flex items-center gap-1.5 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                Live Sync
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Checked In', value: timeInTodayCount, color: 'text-emerald-700', bg: 'bg-emerald-50/70', border: 'border-emerald-200/70' },
                { label: 'Checked Out', value: timeOutTodayCount, color: 'text-sky-700', bg: 'bg-sky-50/70', border: 'border-sky-200/70' },
                { label: 'Geofence Flagged', value: outsideCount, color: 'text-orange-700', bg: 'bg-orange-50/70', border: 'border-orange-200/70' },
              ].map(item => (
                <div key={item.label} className={clsx('rounded-xl p-4 border text-center shadow-2xs', item.bg, item.border)}>
                  <p className={clsx('text-3xl sm:text-4xl font-black', item.color)}>{loading ? '—' : item.value}</p>
                  <p className={clsx('text-[10px] font-extrabold mt-1 uppercase tracking-wider', item.color)}>{item.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold text-navy-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>
              Database: Supabase Cloud Connected
            </span>
            <span className="flex items-center gap-1.5 text-emerald-700 font-extrabold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60">
              <CheckCircle2 size={13} /> Cloud Synced
            </span>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
          <div className="flex items-center justify-between mb-3.5">
            <h2 className="font-black text-navy-900 text-sm">Recent Activity Log</h2>
            <span className="text-[10px] font-bold text-slate-400">Latest 8 records</span>
          </div>
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400 font-medium">Loading activity stream...</div>
          ) : records.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 font-medium">No activity recorded today</div>
          ) : (
            <div className="space-y-3 max-h-[270px] overflow-y-auto pr-1">
              {records.slice(0, 8).map((rec) => (
                <div key={rec.id} className="flex items-center gap-3 py-1.5 border-b border-slate-100 last:border-0">
                  <div className="w-8 h-8 rounded-xl bg-navy-900 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                    {rec.employeeName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-extrabold text-navy-900 truncate">{rec.employeeName}</p>
                    <p className="text-[10px] text-slate-500 truncate">
                      <span className={clsx('font-extrabold', rec.type === 'TIME_IN' ? 'text-emerald-700' : 'text-sky-700')}>
                        {rec.type === 'TIME_IN' ? 'TIME IN' : 'TIME OUT'}
                      </span>
                      {' · '}{rec.siteName}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] font-extrabold text-navy-900">{rec.formattedTime}</p>
                    <span className={clsx(
                      'text-[9px] font-extrabold px-1.5 py-0.5 rounded-md inline-block mt-0.5 border',
                      rec.syncStatus === 'Synced' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80' : 'bg-amber-50 text-amber-700 border-amber-200/80'
                    )}>
                      {rec.syncStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function filterTodayRecords(records: FormattedAttendanceRecord[]) {
  const startOfToday = new Date().setHours(0, 0, 0, 0);
  return records.filter(r => new Date(r.recordedAt).getTime() >= startOfToday);
}
