import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { format } from 'date-fns';
import { CheckCircle2, MapPin, Clock, LogIn, LogOut, Navigation, Sparkles } from 'lucide-react';
import AttendanceFlow from '@/components/attendance/AttendanceFlow';
import { AttendanceType } from '@/types';
import { AttendanceService } from '@/services/attendance/attendanceService';
import { supabase } from '@/lib/supabase/client';
import { clsx } from 'clsx';

interface SiteOption {
  id: string;
  name: string;
  geofence_radius: number;
  latitude: number;
  longitude: number;
}

export default function Home() {
  const { user } = useAuthStore();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeFlow, setActiveFlow] = useState<AttendanceType | null>(null);
  const [lastRecordType, setLastRecordType] = useState<AttendanceType | null>(null);
  const [sitesList, setSitesList] = useState<SiteOption[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [selectedSite, setSelectedSite] = useState<SiteOption | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function loadSiteAndStatus() {
      // 1. Fetch user attendance status
      const records = await AttendanceService.getLocalRecords();
      const userRecords = records.filter(r => r.employeeId === user?.id);
      if (userRecords.length > 0) {
        userRecords.sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
        setLastRecordType(userRecords[0].type);
      }

      // 2. Fetch all assigned sites from Supabase sites table
      try {
        const { data: sites } = await supabase.from('sites').select('*').order('created_at', { ascending: false });
        if (sites && sites.length > 0) {
          const mapped: SiteOption[] = sites.map(s => ({
            id: s.id,
            name: s.name,
            geofence_radius: s.geofence_radius || 100,
            latitude: s.latitude || 14.5547,
            longitude: s.longitude || 121.0244,
          }));
          setSitesList(mapped);
          setSelectedSiteId(mapped[0].id);
          setSelectedSite(mapped[0]);
        }
      } catch (e) {
        console.warn('Could not load sites from Supabase:', e);
      }
    }
    loadSiteAndStatus();
  }, [user]);

  const handleAttendance = (type: AttendanceType) => {
    setActiveFlow(type);
  };

  return (
    <div className="p-5 flex flex-col flex-1 bg-slate-50 min-h-full pb-10">
      
      {/* ── Employee Header Banner ── */}
      <div className="bg-gradient-to-r from-orange-500 via-primary to-orange-600 rounded-3xl p-5 text-white shadow-lg mb-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 translate-x-4 -translate-y-4">
          <Sparkles size={140} />
        </div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-white font-black text-2xl border border-white/30 shadow-inner">
            {user?.name?.charAt(0) || 'E'}
          </div>
          <div>
            <h2 className="font-extrabold text-xl leading-tight">Welcome, {user?.name || 'Technician'}!</h2>
            <p className="text-xs text-orange-100 font-medium mt-0.5">{(user as any)?.role || 'Field Technician'} • Active Session</p>
          </div>
        </div>
      </div>

      {/* ── Live Date & Attendance Status Cards ── */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-neutral-200/70 flex flex-col justify-between">
          <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Today's Status</span>
          <div className="mt-2 flex items-center gap-2">
            <span className={clsx(
              "w-3 h-3 rounded-full animate-pulse",
              lastRecordType === 'TIME_IN' ? "bg-emerald-500" :
              lastRecordType === 'TIME_OUT' ? "bg-blue-500" : "bg-orange-500"
            )} />
            <p className={clsx(
              "font-extrabold text-base",
              lastRecordType === 'TIME_IN' ? "text-emerald-600" :
              lastRecordType === 'TIME_OUT' ? "text-blue-600" : "text-orange-600"
            )}>
              {lastRecordType === 'TIME_IN' ? 'Timed In' : lastRecordType === 'TIME_OUT' ? 'Timed Out' : 'Not Timed In'}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-neutral-200/70 flex flex-col justify-between items-end text-right">
          <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Date & Time</span>
          <div className="mt-2">
            <p className="text-sm font-extrabold text-neutral-800">{format(currentTime, 'MMM dd, yyyy')}</p>
            <p className="text-xs font-semibold text-primary">{format(currentTime, 'hh:mm:ss a')}</p>
          </div>
        </div>
      </div>

      {/* ── Assigned Location Card with Site Dropdown Selector ── */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-200/70 mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-navy-900 uppercase tracking-wider flex items-center gap-1">
            <Navigation size={13} className="text-primary" /> Select Attendance Site
          </span>
          <span className="text-[10px] font-extrabold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200/80">
            GPS Geofenced
          </span>
        </div>

        {/* Dropdown to select site */}
        {sitesList.length > 0 && (
          <div className="mb-3">
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
              Choose Site / Geofence Target:
            </label>
            <select
              value={selectedSiteId}
              onChange={(e) => {
                const sId = e.target.value;
                setSelectedSiteId(sId);
                const found = sitesList.find(s => s.id === sId);
                if (found) setSelectedSite(found);
              }}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-navy-900 shadow-2xs focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none cursor-pointer"
            >
              {sitesList.map((site) => (
                <option key={site.id} value={site.id}>
                    📍 {site.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-start gap-3 pt-2 border-t border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5 font-bold shadow-2xs">
            <MapPin size={20} />
          </div>
          <div>
            <h3 className="font-black text-navy-900 text-base">{selectedSite?.name || 'Converge Field Site'}</h3>
            {selectedSite?.latitude && selectedSite?.longitude && (
              <p className="text-[11px] font-mono font-bold text-slate-400 mt-1">
                Coordinates: {selectedSite.latitude.toFixed(4)}, {selectedSite.longitude.toFixed(4)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Primary Action Buttons (TIME IN / TIME OUT) ── */}
      <div className="flex flex-col gap-3.5 mt-auto pt-2 pb-6">
        <button 
          onClick={() => handleAttendance('TIME_IN')}
          className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-black py-4 px-6 rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-3 text-lg transition-all active:scale-98 cursor-pointer"
        >
          <LogIn size={24} />
          TIME IN NOW
        </button>

        <button 
          onClick={() => handleAttendance('TIME_OUT')}
          className="w-full bg-white hover:bg-neutral-50 text-slate-800 border-2 border-slate-300 font-black py-4 px-6 rounded-2xl shadow-sm flex items-center justify-center gap-3 text-lg transition-all active:scale-98 cursor-pointer"
        >
          <LogOut size={24} className="text-slate-600" />
          TIME OUT NOW
        </button>
      </div>

      {/* Attendance Flow Modal */}
      {activeFlow && (
        <AttendanceFlow
          type={activeFlow}
          initialSite={selectedSite ? {
            id: selectedSite.id,
            name: selectedSite.name,
            latitude: selectedSite.latitude,
            longitude: selectedSite.longitude,
            geofenceRadius: selectedSite.geofence_radius
          } : undefined}
          sitesList={sitesList.map(s => ({
            id: s.id,
            name: s.name,
            latitude: s.latitude,
            longitude: s.longitude,
            geofenceRadius: s.geofence_radius
          }))}
          onComplete={() => console.log('Attendance completed')}
          onClose={() => setActiveFlow(null)}
        />
      )}
    </div>
  );
}
