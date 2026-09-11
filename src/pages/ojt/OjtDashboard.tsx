import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Menu, X, GraduationCap, Clock, CheckCircle2 } from 'lucide-react';
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  useEffect(() => { loadStudentData(); }, [user]);

  const handleTimeIn = async (isHalfDay: boolean, notes?: string) => {
    if (!student) return;
    setActionLoading(true);
    try {
      await OjtService.recordTimeIn(student.id, isHalfDay, notes);
      await loadStudentData();
    } catch (err: any) {
      alert(err.message || 'Failed to record Time In');
    } finally { setActionLoading(false); }
  };

  const handleTimeOut = async (allowOvertime: boolean, notes?: string) => {
    if (!student) return;
    setActionLoading(true);
    try {
      await OjtService.recordTimeOut(student.id, allowOvertime, notes);
      await loadStudentData();
    } catch (err: any) {
      alert(err.message || 'Failed to record Time Out');
    } finally { setActionLoading(false); }
  };

  const confirmLogout = () => {
    setSidebarOpen(false);
    setShowLogoutConfirm(false);
    logout();
    navigate('/ojt/login');
  };

  const initials = student
    ? `${student.firstName?.charAt(0) || ''}${student.lastName?.charAt(0) || ''}`.toUpperCase()
    : user?.name?.charAt(0)?.toUpperCase() || 'O';

  return (
    <div
      className="flex flex-col flex-1 bg-[#0f172a] min-h-screen pb-12 relative overflow-x-hidden"
      style={{ fontFamily: "'Century Gothic', CenturyGothic, AppleGothic, sans-serif" }}
    >
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff33_1px,transparent_1px),linear-gradient(to_bottom,#ffffff33_1px,transparent_1px)] bg-[size:6rem_4rem] pointer-events-none" />

      {/* Banners */}
      <SocialBrowserBanner />
      <PwaInstallBanner appName="OJT Converge" />

      {/* ── Sidebar Backdrop ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-[500] bg-black/60"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar Panel ── */}
      <aside
        className={`fixed top-0 right-0 h-full z-[600] w-72 bg-[#0B192C] border-l border-slate-700/80 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-5 border-b border-slate-700/80 flex items-center justify-between">
          <div className="bg-white/95 px-3 py-1.5 rounded-xl flex items-center">
            <img src="/CSiLogo.png" alt="Converge IT Solutions Inc." className="h-7 w-auto object-contain" />
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Student Info Card */}
        <div className="p-5 border-b border-slate-700/80">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center font-black text-lg text-white shadow-lg shrink-0">
              {initials}
            </div>
            <div className="overflow-hidden">
              <p className="font-extrabold text-sm text-white truncate">{student?.name || user?.name}</p>
              <p className="text-[11px] text-slate-400 font-medium truncate">{student?.school || 'OJT Student'}</p>
            </div>
          </div>

          <div className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border ${
            dailyStats?.isCurrentlyTimedIn
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-slate-800 border-slate-700 text-slate-400'
          }`}>
            <span className={`w-2 h-2 rounded-full shrink-0 ${dailyStats?.isCurrentlyTimedIn ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            {dailyStats?.isCurrentlyTimedIn ? 'Shift Active (Timed In)' : 'Not Timed In Today'}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="p-5 border-b border-slate-700/80 space-y-3">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Quick Stats</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-900/80 rounded-2xl p-2.5 border border-slate-700/60">
              <CheckCircle2 size={14} className="text-emerald-400 mx-auto mb-1" />
              <p className="text-[10px] text-slate-500 font-bold uppercase">Done</p>
              <p className="font-black text-emerald-400 text-sm">{dailyStats?.completedHours || 0}h</p>
            </div>
            <div className="bg-slate-900/80 rounded-2xl p-2.5 border border-slate-700/60">
              <Clock size={14} className="text-orange-400 mx-auto mb-1" />
              <p className="text-[10px] text-slate-500 font-bold uppercase">Left</p>
              <p className="font-black text-orange-400 text-sm">{dailyStats?.remainingHours || student?.requiredHours || 0}h</p>
            </div>
            <div className="bg-slate-900/80 rounded-2xl p-2.5 border border-slate-700/60">
              <GraduationCap size={14} className="text-cyan-400 mx-auto mb-1" />
              <p className="text-[10px] text-slate-500 font-bold uppercase">Done %</p>
              <p className="font-black text-cyan-400 text-sm">{dailyStats?.progressPercentage || 0}%</p>
            </div>
          </div>
        </div>

        {/* Navigation Actions */}
        <div className="p-4 space-y-1.5">
          <button
            onClick={() => { setSidebarOpen(false); setShowProfileModal(true); }}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-sm font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
          >
            <User size={18} className="text-slate-400" />
            Edit Profile
          </button>
        </div>

        {/* Logout at Bottom */}
        <div className="mt-auto p-4 border-t border-slate-700/80">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-sm font-bold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all cursor-pointer border border-red-500/20"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Top Header Bar ── */}
      <div className="bg-[#0B192C]/95 border-b border-slate-700/80 px-4 sm:px-6 py-3.5 flex items-center justify-between relative z-10 shrink-0">
        {/* Logo */}
        <div className="bg-white/95 px-3 py-1.5 rounded-xl shadow-sm flex items-center">
          <img
            src="/CSiLogo.png"
            alt="Converge IT Solutions Inc."
            decoding="sync"
            fetchPriority="high"
            className="h-7 w-auto object-contain"
          />
        </div>

        {/* Center portal tag */}
        <span className="hidden sm:inline-flex text-[10px] font-black uppercase tracking-widest text-cyan-400 bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-500/30">
          OJT Student Portal
        </span>

        {/* Status + Menu */}
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-bold border ${
            dailyStats?.isCurrentlyTimedIn
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-slate-800 border-slate-700 text-slate-400'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dailyStats?.isCurrentlyTimedIn ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="hidden xs:inline">{dailyStats?.isCurrentlyTimedIn ? 'Active' : 'Off Shift'}</span>
          </div>
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 transition-all active:scale-95 cursor-pointer"
            title="Open Menu"
          >
            <Menu size={20} />
          </button>
        </div>
      </div>

      {/* ── Welcome Banner ── */}
      <div className="relative z-10 bg-gradient-to-r from-slate-800/80 to-slate-900/80 border-b border-slate-700/60 px-4 sm:px-6 py-4 flex items-center gap-3 backdrop-blur-md">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center font-black text-base text-white shadow-lg shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <h2 className="font-black text-base sm:text-lg text-white leading-tight truncate">
            Welcome back, {student?.firstName || user?.name?.split(' ')[0] || 'OJT Student'}!
          </h2>
          <p className="text-[11px] text-slate-400 font-medium truncate">
            {student?.school || 'OJT Training Program'} • {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="relative z-10 p-4 sm:p-6 space-y-5 max-w-xl mx-auto w-full">
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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-slate-700 text-center space-y-4">
            <div className="w-14 h-14 bg-red-500/10 text-red-400 rounded-2xl flex items-center justify-center mx-auto border border-red-500/20">
              <LogOut size={28} />
            </div>
            <div>
              <h3 className="font-black text-lg text-white">Sign Out of OJT Portal?</h3>
              <p className="text-xs text-slate-400 font-semibold mt-1">
                Are you sure you want to log out? You will need your email and password to log back in.
              </p>
            </div>
            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 rounded-xl font-bold text-xs bg-slate-700 text-slate-200 hover:bg-slate-600 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="flex-1 py-3 rounded-xl font-bold text-xs bg-red-600 hover:bg-red-700 text-white shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <LogOut size={13} /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
