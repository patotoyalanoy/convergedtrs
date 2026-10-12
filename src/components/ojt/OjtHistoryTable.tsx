import { useState, useMemo } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight, ListFilter, ArrowUpDown } from 'lucide-react';
import { OjtAttendanceRecord } from '@/types/ojt';
import { format } from 'date-fns';

interface Props {
  logs: OjtAttendanceRecord[];
  loading: boolean;
}

export default function OjtHistoryTable({ logs, loading }: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 3;

  const totalPages = Math.max(1, Math.ceil((logs?.length || 0) / pageSize));
  
  // Sort latest first
  const sortedLogs = useMemo(() => {
    if (!logs) return [];
    return [...logs].sort((a, b) => {
      const timeA = a.timeIn ? new Date(a.timeIn).getTime() : new Date(a.date).getTime();
      const timeB = b.timeIn ? new Date(b.timeIn).getTime() : new Date(b.date).getTime();
      return timeB - timeA;
    });
  }, [logs]);

  const pagedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedLogs.slice(start, start + pageSize);
  }, [sortedLogs, currentPage, pageSize]);

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
            <Calendar size={16} className="text-orange-400" /> Daily Attendance Logs
          </h3>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
            Showing {sortedLogs.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, sortedLogs.length)} of {sortedLogs.length} entries
          </p>
        </div>
        <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20 uppercase tracking-wider">
          Page {currentPage} of {totalPages}
        </span>
      </div>

      {/* Log items (Limited to 5 per page) */}
      <div className="space-y-2.5">
        {pagedLogs.map((log) => {
          const formattedIn = log.timeIn ? format(new Date(log.timeIn), 'hh:mm a') : '—';
          const formattedOut = log.timeOut ? format(new Date(log.timeOut), 'hh:mm a') : 'Active...';
          const dateStr = log.timeIn ? format(new Date(log.timeIn), 'MMM dd, yyyy') : log.date;

          return (
            <div
              key={log.id}
              className="bg-slate-900/85 rounded-2xl p-3.5 border border-slate-700/80 space-y-2 text-xs hover:border-slate-600 transition-all"
            >
              {/* Header Row */}
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-200 flex items-center gap-1.5 text-xs">
                  <Calendar size={13} className="text-slate-400" /> {dateStr}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                    log.status === 'On-Time' || log.status === 'Regular'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : log.status === 'Late'
                      ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                      : log.status === 'Half-Day'
                      ? 'bg-orange-500/10 text-orange-200 border border-orange-500/20'
                      : log.status === 'Overtime'
                      ? 'bg-blue-500/30 text-blue-200 border border-blue-400/40'
                      : 'bg-orange-600/20 text-orange-300 border border-orange-500/30'
                  }`}
                >
                  {log.status}
                </span>
              </div>

              {/* Time Row */}
              <div className="grid grid-cols-2 gap-2 bg-slate-800/90 p-2.5 rounded-xl border border-slate-700/80 text-slate-300 font-semibold">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Time In</span>
                  <span className="text-xs font-black text-blue-400">{formattedIn}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Time Out</span>
                  <span className="text-xs font-black text-orange-400">{formattedOut}</span>
                </div>
              </div>

              {/* Hours Breakdown Row */}
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 pt-0.5">
                <div className="flex items-center gap-3">
                  <span>Regular: <b className="text-white">{log.timeOut ? `${log.regularHours || 0} hrs` : 'In Progress'}</b></span>
                  {log.overtimeHours > 0 && (
                    <span>OT: <b className="text-blue-400">+{log.overtimeHours} hrs</b></span>
                  )}
                </div>
                <span className="text-xs font-black text-orange-300 bg-primary/20 px-2 py-0.5 rounded-lg border border-primary/30">
                  Total: {log.timeOut 
                    ? `${log.totalHoursWorked || 0} hrs` 
                    : `In Progress (${(Math.max(0, (new Date().getTime() - new Date(log.timeIn).getTime()) / (1000 * 3600))).toFixed(1)} hrs)`}
                </span>
              </div>

              {log.notes && (
                <p className="text-[10px] text-slate-400 font-medium italic pt-1 border-t border-slate-700/60">
                  "{log.notes}"
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 border-t border-slate-700/60">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronLeft size={14} /> Previous
          </button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentPage === page
                    ? 'bg-blue-600 text-white font-black shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700/80'
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
