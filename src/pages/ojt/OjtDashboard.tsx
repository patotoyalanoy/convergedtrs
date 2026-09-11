import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import OjtProgressCard from '@/components/ojt/OjtProgressCard';
import OjtTimeControls from '@/components/ojt/OjtTimeControls';
import OjtHistoryTable from '@/components/ojt/OjtHistoryTable';
import OjtProfileModal from '@/components/ojt/OjtProfileModal';
import SocialBrowserBanner from '@/components/common/SocialBrowserBanner';
import PwaInstallBanner from '@/components/common/PwaInstallBanner';
import { OjtStudent, OjtAttendanceRecord, OjtDailyStats } from '@/types/ojt';
import { OjtService } from '@/services/ojt/ojtService';

export default function OjtDashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const [student, setStudent] = useState<OjtStudent | null>(null);
  const [dailyStats, setDailyStats] = useState<OjtDailyStats | null>(null);
  const [attendanceLogs, setAttendanceLogs] = useState<OjtAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const loadStudentData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      let s = await OjtService.getStudentById(user.id);

      if (!s) {
        const allStudents = await OjtService.getAllStudents();
        s = allStudents.find((st) => st.name.toLowerCase() === user.name.toLowerCase()) || null;
      }

      if (s) {
        setStudent(s);
        const stats = await OjtService.getStudentDailyStats(s.id);
        setDailyStats(stats);
        const logs = await OjtService.getStudentAttendanceLogs(s.id);
        setAttendanceLogs(logs);
      }
    } catch (e) {
      console.warn('OJT dashboard load error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudentData();
  }, [user]);

  const handleTimeIn = async (isHalfDay: boolean, notes?: string) => {
    if (!student) return;
    setActionLoading(true);
    try {
      await OjtService.recordTimeIn(student.id, isHalfDay, notes);
      await loadStudentData();
    } catch (err: any) {
      alert(err.message || 'Failed to record Time In');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTimeOut = async (allowOvertime: boolean, notes?: string) => {
    if (!student) return;
    setActionLoading(true);
    try {
      await OjtService.recordTimeOut(student.id, allowOvertime, notes);
      await loadStudentData();
    } catch (err: any) {
      alert(err.message || 'Failed to record Time Out');
    } finally {
      setActionLoading(false);
    }
  };

  const confirmLogout = () => {
    logout();
    navigate('/ojt/login');
  };

  return (
    <div 
      className="flex flex-col flex-1 bg-[#0f172a] min-h-screen pb-12 relative overflow-hidden"
      style={{ fontFamily: "'Century Gothic', CenturyGothic, AppleGothic, sans-serif" }}
    >
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff33_1px,transparent_1px),linear-gradient(to_bottom,#ffffff33_1px,transparent_1px)] bg-[size:6rem_4rem] pointer-events-none" />

      {/* In-App Browser Detector Banner */}
      <SocialBrowserBanner />

      {/* PWA Install Prompt Banner */}
      <PwaInstallBanner appName="OJT Converge" />

      {/* ── Header Banner ── */}
      <div className="bg-gradient-to-r from-slate-900 via-[#0F172A] to-[#1E3E62] rounded-b-[36px] p-5 sm:p-6 text-white shadow-xl border-b border-slate-700/80 relative overflow-hidden z-10 space-y-4">
        {/* Top Row: Logo & Actions */}
        <div className="flex items-center justify-between gap-3 relative z-10">
          <div className="bg-white/95 px-3 py-1.5 rounded-2xl shadow-sm border border-white/40 flex items-center shrink-0">
            <img
              src="/CSiLogo.png"
              alt="Converge IT Solutions Inc."
              decoding="sync"
              fetchPriority="high"
              className="h-7 sm:h-8 w-auto object-contain"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowProfileModal(true)}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/80 transition-all active:scale-95 cursor-pointer shadow-sm"
              title="Edit Profile"
            >
              <User size={18} />
            </button>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="p-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 transition-all active:scale-95 cursor-pointer shadow-sm"
              title="Sign Out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Second Row: Greeting Info & Status Pill */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 relative z-10 pt-1">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 bg-cyan-950/60 px-2.5 py-0.5 rounded-full border border-cyan-500/30 inline-block mb-1">
              OJT Student Portal
            </span>
            <h2 className="font-black text-xl sm:text-2xl text-white leading-tight">
              Welcome, {student?.firstName || user?.name?.split(' ')[0] || 'OJT Student'}!
            </h2>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              {student?.school || 'OJT Training Program'}
            </p>
          </div>

          {/* Status Pill */}
          <div className="inline-flex items-center gap-2 bg-slate-900/90 text-white px-3.5 py-2 rounded-full text-xs font-bold border border-slate-700/80 shrink-0 self-start sm:self-auto shadow-md">
            <span className={`w-2.5 h-2.5 rounded-full ${dailyStats?.isCurrentlyTimedIn ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            {dailyStats?.isCurrentlyTimedIn ? 'Shift Active (Timed In)' : 'Not Timed In Today'}
          </div>
        </div>
      </div>

      {/* ── Main Content Container ── */}
      <div className="relative z-10 p-4 sm:p-6 space-y-5 max-w-xl mx-auto w-full -mt-3">
        {student && (
          <OjtProgressCard
            student={student}
            completedHours={dailyStats?.completedHours || 0}
            remainingHours={dailyStats?.remainingHours || student.requiredHours}
            progressPercentage={dailyStats?.progressPercentage || 0}
          />
        )}

        <OjtTimeControls
          todayRecord={dailyStats?.todayRecord || null}
          isCurrentlyTimedIn={dailyStats?.isCurrentlyTimedIn || false}
          onTimeIn={handleTimeIn}
          onTimeOut={handleTimeOut}
          loading={actionLoading || loading}
        />

        <OjtHistoryTable logs={attendanceLogs} loading={loading} />
      </div>

      {/* Profile Modal */}
      {showProfileModal && student && (
        <OjtProfileModal
          student={student}
          onClose={() => setShowProfileModal(false)}
          onProfileUpdated={loadStudentData}
        />
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-neutral-200 text-center space-y-4">
            <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto shadow-inner border border-red-100">
              <LogOut size={28} />
            </div>
            <div>
              <h3 className="font-black text-lg text-neutral-800">Sign Out of OJT Portal?</h3>
              <p className="text-xs text-neutral-500 font-semibold mt-1">
                Are you sure you want to log out? You will need your email and password to log back in.
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 rounded-xl font-bold text-xs bg-slate-100 text-neutral-700 hover:bg-slate-200 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="flex-1 py-3 rounded-xl font-bold text-xs bg-red-600 hover:bg-red-700 text-white shadow-md transition-all cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
