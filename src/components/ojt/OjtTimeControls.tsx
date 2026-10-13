import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { LogIn, LogOut, Clock, AlertCircle, Sparkles, ChevronRight, ToggleLeft, ToggleRight, Sun, Moon } from 'lucide-react';
import { OjtAttendanceRecord } from '@/types/ojt';
import { OjtService } from '@/services/ojt/ojtService';

interface Props {
  todayRecord: OjtAttendanceRecord | null;
  isCurrentlyTimedIn: boolean;
  onTimeIn: (isHalfDay: boolean, notes?: string) => Promise<void>;
  onTimeOut: (allowOvertime: boolean, notes?: string) => Promise<void>;
  /** Called once the active session reaches its cap so the parent can reload (auto-closes it). */
  onAutoTimeOut: () => Promise<void>;
  loading: boolean;
}

export default function OjtTimeControls({ todayRecord, isCurrentlyTimedIn, onTimeIn, onTimeOut, onAutoTimeOut, loading }: Props) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [notes, setNotes] = useState('');

  const openRecord = isCurrentlyTimedIn && todayRecord && !todayRecord.timeOut ? todayRecord : null;

  // Overtime request is stored on the attendance record itself (Dexie + Supabase), so it
  // survives refreshes, works across devices, and is respected by the auto time-out.
  const [allowOvertime, setAllowOvertimeState] = useState<boolean>(!!openRecord?.isOvertime);

  useEffect(() => {
    setAllowOvertimeState(!!openRecord?.isOvertime);
  }, [openRecord?.id, openRecord?.isOvertime]);

  const setAllowOvertime = async (val: boolean) => {
    setAllowOvertimeState(val);
    if (!openRecord) return;
    try {
      await OjtService.setOvertimeRequest(openRecord.id, val);
    } catch (e) {
      console.warn('Failed to save overtime request:', e);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ── Auto Time-Out ──
  const sessionCap = openRecord
    ? OjtService.getSessionCap(openRecord.timeIn, openRecord.isHalfDay, allowOvertime)
    : null;
  const autoTriggeredFor = useRef<string | null>(null);

  useEffect(() => {
    if (!openRecord || !sessionCap || loading) return;
    if (currentTime.getTime() >= sessionCap.getTime() && autoTriggeredFor.current !== openRecord.id) {
      autoTriggeredFor.current = openRecord.id;
      onAutoTimeOut().catch((e) => console.warn('Auto time-out failed:', e));
    }
  }, [currentTime, openRecord?.id, sessionCap?.getTime(), loading]);

  const handleTimeInClick = async () => {
    await onTimeIn(isHalfDay, notes);
    setNotes('');
  };

  const handleTimeOutClick = async () => {
    await onTimeOut(allowOvertime, notes);
    setNotes('');
  };

  const isLateNow = () => OjtService.isTimeInLate(currentTime);


  return (
    <div className="bg-slate-800/90 rounded-3xl p-5 shadow-xl border border-slate-700/80 space-y-5 text-white backdrop-blur-md">
      {/* Live Clock & Schedule Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Today's Date</span>
          <span className="text-sm font-extrabold text-white">{format(currentTime, 'EEEE, MMM dd, yyyy')}</span>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Live Time</span>
          <span className="text-base font-black text-orange-400 font-mono">{format(currentTime, 'hh:mm:ss a')}</span>
        </div>
      </div>

      {/* Schedule Guidelines Pill */}
      <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-700/80 text-xs space-y-1.5">
        <div className="flex items-center justify-between font-bold text-slate-200">
          <span className="flex items-center gap-1.5">
            <Clock size={14} className="text-orange-400" /> Regular Schedule:
          </span>
          <span className="text-orange-400">08:00 AM - 05:00 PM (8 hrs)</span>
        </div>
        <div className="text-[11px] text-slate-400 flex flex-wrap gap-y-1 justify-between font-medium">
          <span>Early In: <b className="text-white">7:30 AM</b></span>
          <span>Late After: <b className="text-orange-400">9:30 AM</b></span>
          <span>Max OT: <b className="text-blue-400">7:00 PM (10h)</b></span>
        </div>
      </div>

      {/* Options Toggles (Half Day & Overtime) */}
      {!isCurrentlyTimedIn ? (
        /* Options before Time In */
        <div className="flex items-center justify-between bg-orange-950/40 p-3 rounded-2xl border border-orange-500/30">
          <div>
            <span className="font-extrabold text-white text-xs flex items-center gap-1">
              <Sun size={14} className="text-orange-400" /> Half-Day Attendance (4.0 hrs)
            </span>
            <span className="text-[10px] text-slate-400 font-medium block">Log a 4-hour morning or afternoon session</span>
          </div>
          <button
            onClick={() => setIsHalfDay(!isHalfDay)}
            disabled={loading}
            className="text-primary cursor-pointer active:scale-95 transition-transform"
          >
            {isHalfDay ? <ToggleRight size={32} className="text-orange-400" /> : <ToggleLeft size={32} className="text-slate-500" />}
          </button>
        </div>
      ) : (
        /* Options before Time Out */
        <div className="flex items-center justify-between bg-blue-950/40 p-3 rounded-2xl border border-blue-500/30">
          <div>
            <span className="font-extrabold text-white text-xs flex items-center gap-1">
              <Moon size={14} className="text-blue-400" /> Overtime Request (Up to +2.0 hrs)
            </span>
            <span className="text-[10px] text-slate-400 font-medium block">Extend shift up to 7:00 PM max (10h max total)</span>
          </div>
          <button
            onClick={() => setAllowOvertime(!allowOvertime)}
            disabled={loading}
            className="text-primary cursor-pointer active:scale-95 transition-transform"
          >
            {allowOvertime ? <ToggleRight size={32} className="text-blue-400" /> : <ToggleLeft size={32} className="text-slate-500" />}
          </button>
        </div>
      )}

      {/* Notes Input Optional */}
      <div>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional activity / task notes for today..."
          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-semibold text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/40 outline-none"
        />
      </div>

      {/* Action Buttons */}
      {!isCurrentlyTimedIn ? (
        <button
          onClick={handleTimeInClick}
          disabled={loading}
          className="relative w-full bg-gradient-to-r from-blue-600 via-blue-500 to-blue-700 hover:from-blue-500 hover:to-blue-800 text-white font-black py-4 px-6 rounded-2xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-3 text-base transition-all duration-200 active:scale-[0.97] cursor-pointer disabled:opacity-50"
        >
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <LogIn size={20} />
          </div>
          <div className="flex flex-col items-start text-left">
            <span className="leading-tight">TIME IN NOW</span>
            <span className="text-[10px] font-semibold text-blue-100 opacity-90">
              {isHalfDay ? 'Log Half-Day Session (4h)' : isLateNow() ? 'Status: Late (After 9:30 AM)' : 'Status: On-Time'}
            </span>
          </div>
          <ChevronRight size={18} className="ml-auto opacity-60" />
        </button>
      ) : (
        <button
          onClick={handleTimeOutClick}
          disabled={loading}
          className="relative w-full bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-black py-4 px-6 rounded-2xl shadow-lg shadow-orange-500/20 flex items-center justify-center gap-3 text-base transition-all duration-200 active:scale-[0.97] cursor-pointer disabled:opacity-50"
        >
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <LogOut size={20} />
          </div>
          <div className="flex flex-col items-start text-left">
            <span className="leading-tight">TIME OUT NOW</span>
            <span className="text-[10px] font-semibold text-orange-100 opacity-90">
              {allowOvertime ? 'Includes Overtime (Up to 7:00 PM)' : 'Regular Shift Time Out'}
              {sessionCap && ` • Auto Time-Out ${format(sessionCap, 'hh:mm a')}`}
            </span>
          </div>
          <ChevronRight size={18} className="ml-auto opacity-60" />
        </button>
      )}
    </div>
  );
}
