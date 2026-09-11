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
      <div className="bg-white rounded-3xl p-8 text-center text-neutral-400 text-xs font-semibold shadow-sm border border-neutral-200/80">
        Loading OJT attendance history logs...
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-8 text-center text-neutral-400 text-xs font-semibold shadow-sm border border-neutral-200/80">
        No OJT attendance records logged yet. Use the controls above to Time In!
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-neutral-200/80 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-extrabold text-sm text-neutral-800 flex items-center gap-2">
          <Calendar size={16} className="text-primary" /> Daily Attendance Logs ({logs.length})
        </h3>
        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
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
              className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2.5 text-xs hover:border-slate-300 transition-all"
            >
              {/* Header Row */}
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-neutral-800 flex items-center gap-1.5">
                  <Calendar size={13} className="text-neutral-400" /> {dateStr}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                    log.status === 'On-Time' || log.status === 'Regular'
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      : log.status === 'Late'
                      ? 'bg-orange-100 text-orange-700 border border-orange-200'
                      : log.status === 'Half-Day'
                      ? 'bg-amber-100 text-amber-700 border border-amber-200'
                      : log.status === 'Overtime'
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-rose-100 text-rose-700 border border-rose-200'
                  }`}
                >
                  {log.status}
                </span>
              </div>

              {/* Time Row */}
              <div className="grid grid-cols-2 gap-2 bg-white p-2.5 rounded-xl border border-slate-100 text-neutral-700 font-semibold">
                <div>
                  <span className="text-[10px] text-neutral-400 block font-bold uppercase">Time In</span>
                  <span className="text-xs font-black text-emerald-600">{formattedIn}</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 block font-bold uppercase">Time Out</span>
                  <span className="text-xs font-black text-orange-600">{formattedOut}</span>
                </div>
              </div>

              {/* Hours Breakdown Row */}
              <div className="flex items-center justify-between text-[11px] font-bold text-neutral-600 pt-1">
                <div className="flex items-center gap-3">
                  <span>Regular: <b className="text-neutral-900">{log.regularHours || 0} hrs</b></span>
                  {log.overtimeHours > 0 && (
                    <span>OT: <b className="text-blue-600">+{log.overtimeHours} hrs</b></span>
                  )}
                </div>
                <span className="text-xs font-black text-primary bg-primary/10 px-2.5 py-0.5 rounded-lg border border-primary/20">
                  Total: {log.totalHoursWorked || 0} hrs
                </span>
              </div>

              {log.notes && (
                <p className="text-[11px] text-neutral-500 font-medium italic pt-1 border-t border-slate-200/60">
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
