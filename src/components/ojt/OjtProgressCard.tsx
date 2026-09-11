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
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-neutral-200/80 space-y-4">
      {/* Header Info */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-xl border border-primary/20 shrink-0">
            <GraduationCap size={24} />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-neutral-800 leading-tight">
              {student.name}
            </h3>
            <p className="text-xs text-neutral-500 font-semibold mt-0.5">
              {student.school} • OJT Student
            </p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
          progressPercentage >= 100
            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
            : 'bg-primary/10 text-primary border border-primary/20'
        }`}>
          {progressPercentage >= 100 ? 'Completed' : 'In Progress'}
        </span>
      </div>

      {/* Progress Bar */}
      <div>
        <div className="flex justify-between items-center text-xs mb-1.5">
          <span className="font-bold text-neutral-600 flex items-center gap-1">
            <Award size={14} className="text-primary" /> Overall OJT Completion Progress
          </span>
          <span className="font-black text-primary text-sm">{progressPercentage}%</span>
        </div>
        <div className="w-full h-3.5 bg-neutral-100 rounded-full overflow-hidden p-0.5 border border-neutral-200 shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-primary via-orange-400 to-emerald-500 rounded-full transition-all duration-500 shadow-sm"
            style={{ width: `${Math.min(100, Math.max(0, progressPercentage))}%` }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-neutral-100 text-center">
        <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200/60">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Completed</span>
          <span className="text-base font-black text-emerald-600 block mt-0.5">{completedHours} hrs</span>
        </div>
        <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200/60">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Remaining</span>
          <span className="text-base font-black text-orange-600 block mt-0.5">{remainingHours} hrs</span>
        </div>
        <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200/60">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Required</span>
          <span className="text-base font-black text-neutral-800 block mt-0.5">{student.requiredHours} hrs</span>
        </div>
      </div>
    </div>
  );
}
