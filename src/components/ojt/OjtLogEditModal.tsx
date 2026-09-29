import { useState } from 'react';
import { X, Clock, Calendar, CheckCircle, AlertTriangle } from 'lucide-react';
import { OjtAttendanceRecord } from '@/types/ojt';
import { OjtService } from '@/services/ojt/ojtService';

interface Props {
  log: OjtAttendanceRecord;
  onClose: () => void;
  onSaved: () => void;
}

export default function OjtLogEditModal({ log, onClose, onSaved }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [date, setDate] = useState(log.date);
  
  // Helper to convert ISO string to HH:mm for datetime-local or time input
  const formatTimeForInput = (isoString?: string) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const [timeInDateStr, setTimeInDateStr] = useState(log.timeIn ? log.timeIn.split('T')[0] : log.date);
  const [timeInTime, setTimeInTime] = useState(formatTimeForInput(log.timeIn));
  
  const [timeOutDateStr, setTimeOutDateStr] = useState(log.timeOut ? log.timeOut.split('T')[0] : log.date);
  const [timeOutTime, setTimeOutTime] = useState(formatTimeForInput(log.timeOut));

  const [totalHoursWorked, setTotalHoursWorked] = useState(log.totalHoursWorked?.toString() || '0');
  const [notes, setNotes] = useState(log.notes || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!timeInDateStr || !timeInTime) {
        throw new Error('Time In is required.');
      }

      // Reconstruct ISO strings
      // We assume local time for input
      const timeInIso = new Date(`${timeInDateStr}T${timeInTime}:00`).toISOString();
      let timeOutIso: string | undefined = undefined;

      if (timeOutTime && timeOutDateStr) {
        timeOutIso = new Date(`${timeOutDateStr}T${timeOutTime}:00`).toISOString();
        if (new Date(timeOutIso).getTime() <= new Date(timeInIso).getTime()) {
          throw new Error('Time Out must be after Time In.');
        }
      }

      const updates: Partial<OjtAttendanceRecord> = {
        date,
        timeIn: timeInIso,
        timeOut: timeOutIso,
        notes,
      };

      // If they manually override total hours
      const parsedHours = parseFloat(totalHoursWorked);
      if (!isNaN(parsedHours) && parsedHours !== log.totalHoursWorked) {
        updates.totalHoursWorked = parsedHours;
      }

      await OjtService.updateAttendanceLog(log.id, updates);
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update attendance record.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200"
      >
        <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
          <h3 className="font-extrabold text-lg text-neutral-800 flex items-center gap-2">
            <Clock className="text-primary" size={20} /> Edit Attendance Log
          </h3>
          <button onClick={onClose} className="p-1.5 bg-slate-100 hover:bg-slate-200 text-neutral-600 rounded-xl transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl flex items-center gap-2">
              <AlertTriangle size={16} /> {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-neutral-500 mb-1.5 uppercase tracking-wider">
              Shift Date
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-neutral-800 font-semibold focus:ring-2 focus:ring-primary/20 outline-none text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-500 mb-1.5 uppercase tracking-wider">
                Time In Date & Time
              </label>
              <div className="space-y-2">
                <input
                  type="date"
                  required
                  value={timeInDateStr}
                  onChange={(e) => setTimeInDateStr(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-neutral-800 font-semibold focus:ring-2 focus:ring-primary/20 outline-none text-xs"
                />
                <input
                  type="time"
                  required
                  value={timeInTime}
                  onChange={(e) => setTimeInTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-neutral-800 font-semibold focus:ring-2 focus:ring-primary/20 outline-none text-xs"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-neutral-500 mb-1.5 uppercase tracking-wider">
                Time Out Date & Time
              </label>
              <div className="space-y-2">
                <input
                  type="date"
                  value={timeOutDateStr}
                  onChange={(e) => setTimeOutDateStr(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-neutral-800 font-semibold focus:ring-2 focus:ring-primary/20 outline-none text-xs"
                />
                <input
                  type="time"
                  value={timeOutTime}
                  onChange={(e) => setTimeOutTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-neutral-800 font-semibold focus:ring-2 focus:ring-primary/20 outline-none text-xs"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-500 mb-1.5 uppercase tracking-wider">
              Total Hours (Auto-calculates if unchanged)
            </label>
            <input
              type="number"
              step="0.01"
              value={totalHoursWorked}
              onChange={(e) => setTotalHoursWorked(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-neutral-800 font-semibold focus:ring-2 focus:ring-primary/20 outline-none text-sm"
            />
            <p className="text-[10px] text-neutral-400 mt-1 font-medium leading-tight">
              Leave as is to let the system recalculate hours automatically based on the Time In/Out changes.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-500 mb-1.5 uppercase tracking-wider">
              Admin Notes / Reason
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="E.g., Adjusted time out because student forgot."
              rows={2}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-neutral-800 font-semibold focus:ring-2 focus:ring-primary/20 outline-none text-sm resize-none"
            />
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 rounded-xl font-bold text-xs bg-slate-100 text-neutral-700 hover:bg-slate-200 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-xl font-bold text-xs bg-primary hover:bg-primary-dark text-white shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <CheckCircle size={15} /> {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
