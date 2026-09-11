import { Award, Clock, GraduationCap, CheckCircle2 } from 'lucide-react';
import { OjtStudent } from '@/types/ojt';

interface Props {
  student: OjtStudent;
  completedHours: number;
  remainingHours: number;
  progressPercentage: number;
}

export default function OjtProgressCard({ student, completedHours, remainingHours, progressPercentage }: Props) {
  return (
    <div className="bg-slate-800/90 rounded-3xl p-5 shadow-xl border border-slate-700/80 space-y-4 text-white backdrop-blur-md">
      {/* Header Info */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/20 text-orange-400 flex items-center justify-center font-black text-xl border border-primary/30 shrink-0">
            <GraduationCap size={24} />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-white leading-tight">
              {student.name}
            </h3>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              {student.school} • OJT Student
            </p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
          progressPercentage >= 100
            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            : 'bg-primary/20 text-orange-300 border border-primary/30'
        }`}>
          {progressPercentage >= 100 ? 'Completed' : 'In Progress'}
        </span>
      </div>

      {/* Progress Bar */}
      <div>
        <div className="flex justify-between items-center text-xs mb-1.5">
          <span className="font-bold text-slate-300 flex items-center gap-1">
            <Award size={14} className="text-orange-400" /> Overall OJT Completion Progress
          </span>
          <span className="font-black text-orange-400 text-sm">{progressPercentage}%</span>
        </div>
        <div className="w-full h-3.5 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-700 shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-primary via-orange-400 to-emerald-500 rounded-full transition-all duration-500 shadow-sm"
            style={{ width: `${Math.min(100, Math.max(0, progressPercentage))}%` }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-slate-700/60 text-center">
        <div className="bg-slate-900/80 p-2.5 rounded-2xl border border-slate-700/60">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Completed</span>
          <span className="text-base font-black text-emerald-400 block mt-0.5">{completedHours} hrs</span>
        </div>
        <div className="bg-slate-900/80 p-2.5 rounded-2xl border border-slate-700/60">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Remaining</span>
          <span className="text-base font-black text-orange-400 block mt-0.5">{remainingHours} hrs</span>
        </div>
        <div className="bg-slate-900/80 p-2.5 rounded-2xl border border-slate-700/60">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Required</span>
          <span className="text-base font-black text-slate-200 block mt-0.5">{student.requiredHours} hrs</span>
        </div>
      </div>
    </div>
  );
}
