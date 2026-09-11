import { Calendar, Clock, CheckCircle2, AlertCircle, Sun, Moon, ShieldAlert } from 'lucide-react';
import { OjtAttendanceRecord } from '@/types/ojt';
import { format } from 'date-fns';

interface Props {
  logs: OjtAttendanceRecord[];
  loading: boolean;
}

export default function OjtHistoryTable({ logs, loading }: Props) {
  if (loading) {
    return (
      <div className="bg-slate-800/90 rounded-3xl p-8 text-center text-slate-400 text-xs font-semibold shadow-xl border border-slate-700/80 backdrop-blur-md">
        Loading OJT attendance history logs...
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="bg-slate-800/90 rounded-3xl p-8 text-center text-slate-400 text-xs font-semibold shadow-xl border border-slate-700/80 backdrop-blur-md">
        No OJT attendance records logged yet. Use the controls above to Time In!
      </div>
    );
  }

  return (
    <div className="bg-slate-800/90 rounded-3xl p-5 shadow-xl border border-slate-700/80 space-y-4 text-white backdrop-blur-md">
      <div className="flex items-center justify-between">
        <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
          <Calendar size={16} className="text-orange-400" /> Daily Attendance Logs ({logs.length})
        </h3>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Auto Calculated
        </span>
      </div>

      <div className="space-y-3">
        {logs.map((log) => {
          const formattedIn = log.timeIn ? format(new Date(log.timeIn), 'hh:mm a') : '—';
          const formattedOut = log.timeOut ? format(new Date(log.timeOut), 'hh:mm a') : 'Active...';
          const dateStr = log.timeIn ? format(new Date(log.timeIn), 'MMM dd, yyyy') : log.date;

          return (
            <div
              key={log.id}
              className="bg-slate-900/80 rounded-2xl p-4 border border-slate-700/80 space-y-2.5 text-xs hover:border-slate-600 transition-all"
            >
              {/* Header Row */}
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-200 flex items-center gap-1.5">
                  <Calendar size={13} className="text-slate-400" /> {dateStr}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                    log.status === 'On-Time' || log.status === 'Regular'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : log.status === 'Late'
                      ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                      : log.status === 'Half-Day'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : log.status === 'Overtime'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {log.status}
                </span>
              </div>

              {/* Time Row */}
              <div className="grid grid-cols-2 gap-2 bg-slate-800 p-2.5 rounded-xl border border-slate-700 text-slate-300 font-semibold">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Time In</span>
                  <span className="text-xs font-black text-emerald-400">{formattedIn}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Time Out</span>
                  <span className="text-xs font-black text-orange-400">{formattedOut}</span>
                </div>
              </div>

              {/* Hours Breakdown Row */}
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 pt-1">
                <div className="flex items-center gap-3">
                  <span>Regular: <b className="text-white">{log.timeOut ? `${log.regularHours || 0} hrs` : 'In Progress'}</b></span>
                  {log.overtimeHours > 0 && (
                    <span>OT: <b className="text-blue-400">+{log.overtimeHours} hrs</b></span>
                  )}
                </div>
                <span className="text-xs font-black text-orange-300 bg-primary/20 px-2.5 py-0.5 rounded-lg border border-primary/30">
                  Total: {log.timeOut 
                    ? `${log.totalHoursWorked || 0} hrs` 
                    : `In Progress (${(Math.max(0, (new Date().getTime() - new Date(log.timeIn).getTime()) / (1000 * 3600))).toFixed(1)} hrs)`}
                </span>
              </div>

              {log.notes && (
                <p className="text-[11px] text-slate-400 font-medium italic pt-1 border-t border-slate-700/60">
                  "{log.notes}"
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
