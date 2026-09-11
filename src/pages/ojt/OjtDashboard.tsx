import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, LogOut, User, Sparkles, RefreshCw } from 'lucide-react';
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

  const loadStudentData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      let s = await OjtService.getStudentById(user.id);

      // If missing, try matching by name or fallback creation
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

  const handleLogout = () => {
    logout();
    navigate('/ojt/login');
  };

  return (
    <div 
      className="flex flex-col flex-1 bg-slate-50 min-h-screen pb-12 relative"
      style={{ fontFamily: "'Century Gothic', CenturyGothic, AppleGothic, sans-serif" }}
    >
      {/* In-App Browser Detector Banner */}
      <SocialBrowserBanner />

      {/* PWA Install Prompt Banner */}
      <PwaInstallBanner />

      {/* ── Header Banner ── */}
      <div className="bg-gradient-to-r from-primary via-orange-500 to-amber-600 rounded-b-[36px] p-6 text-white shadow-lg relative overflow-hidden">
        <div className="flex justify-between items-center mb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center font-black text-xl border border-white/30 backdrop-blur-md">
              <GraduationCap size={26} />
            </div>
            <div>
              <h2 className="font-black text-lg leading-tight">
                Welcome, {student?.firstName || user?.name?.split(' ')[0] || 'OJT Student'}!
              </h2>
              <p className="text-xs text-orange-100 font-medium">
                {student?.school || 'OJT Training Program'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowProfileModal(true)}
              className="p-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-md transition-colors cursor-pointer"
              title="Edit Profile"
            >
              <User size={18} />
            </button>
            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-md transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Status Pill */}
        <div className="inline-flex items-center gap-2 bg-black/20 text-white px-3.5 py-1.5 rounded-full text-xs font-bold backdrop-blur-md border border-white/20">
          <span className={`w-2 h-2 rounded-full ${dailyStats?.isCurrentlyTimedIn ? 'bg-emerald-400 animate-pulse' : 'bg-orange-300'}`} />
          {dailyStats?.isCurrentlyTimedIn ? 'Shift Active (Timed In)' : 'Not Timed In Today'}
        </div>
      </div>

      {/* ── Main Content Container ── */}
      <div className="p-4 sm:p-6 space-y-5 max-w-xl mx-auto w-full -mt-3">
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
    </div>
  );
}
