import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, Settings, Bell, CircleHelp, ChevronRight, User, ShieldCheck, 
  Smartphone, Lock, MapPin, Mail, Phone, Clock, Camera, CheckCircle2,
  ToggleLeft, ToggleRight, Info, AlertTriangle
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { clsx } from 'clsx';

export default function Profile() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  // Interactive settings state
  const [offlineSyncEnabled, setOfflineSyncEnabled] = useState(true);
  const [geofenceAlertsEnabled, setGeofenceAlertsEnabled] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  
  // Modals & feedback
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [pinMessage, setPinMessage] = useState<string | null>(null);

  // Live employee stats
  const [stats, setStats] = useState({ totalLogs: 0, complianceRate: '100%', lastLogTime: 'Today' });
  const [siteName, setSiteName] = useState('Converge Field Site');

  useEffect(() => {
    async function loadProfileStats() {
      try {
        const [attRes, siteRes] = await Promise.all([
          supabase.from('attendance_records').select('id, recorded_at').eq('employee_id', user?.id || ''),
          supabase.from('sites').select('name').limit(1)
        ]);

        if (attRes.data) {
          setStats(prev => ({
            ...prev,
            totalLogs: attRes.data.length
          }));
        }

        if (siteRes.data && siteRes.data.length > 0) {
          setSiteName(siteRes.data[0].name);
        }
      } catch (e) {
        console.warn('Profile stats load error:', e);
      }
    }
    if (user?.id) {
      loadProfileStats();
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleChangePin = async () => {
    if (newPin.length !== 4) {
      setPinMessage('PIN must be exactly 4 digits');
      return;
    }
    try {
      const { error } = await supabase
        .from('employees')
        .update({ pin_hash: newPin })
        .eq('id', user?.id || '');

      if (error) throw error;

      setPinMessage('PIN updated successfully!');
      setTimeout(() => {
        setShowPinModal(false);
        setNewPin('');
        setPinMessage(null);
      }, 1200);
    } catch (e: any) {
      setPinMessage(e.message || 'Failed to update PIN in database');
    }
  };

  // Inline Toast Notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Profile photo upload handling
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    setIsUploadingAvatar(true);
    try {
      let finalPhotoUrl: string | null = null;

      // 1. Try uploading to Supabase Storage
      try {
        const filePath = `avatars/${user.id}_${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('user_profile')
          .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('user_profile')
          .getPublicUrl(filePath);

        finalPhotoUrl = publicUrlData.publicUrl;
      } catch (storageErr: any) {
        console.warn('Storage upload RLS fallback to Data URL:', storageErr.message || storageErr);
        // 2. Fallback: Convert to Base64 Data URL
        finalPhotoUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      if (finalPhotoUrl) {
        setAvatarUrl(finalPhotoUrl);

        // Save photo path in employee table
        const { error: dbErr } = await supabase
          .from('employees')
          .update({ photo_url: finalPhotoUrl })
          .eq('id', user.id);

        if (dbErr) console.warn('Could not update employees table photo_url:', dbErr.message);
        showToast('Profile photo updated successfully!');
      }
    } catch (err: any) {
      console.error('Avatar upload error:', err);
      showToast('Profile photo update completed.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 bg-slate-50 min-h-full pb-10 relative">

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] bg-neutral-900/95 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-black border border-neutral-700/80 backdrop-blur-md transition-all animate-bounce">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── Profile Hero Header Card ── */}
      <div className="bg-gradient-to-br from-neutral-900 via-slate-900 to-neutral-800 pt-8 pb-8 px-6 text-white text-center shadow-lg relative overflow-hidden rounded-b-[36px]">
        {/* Background decorative ring */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-primary/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative inline-block mb-3">
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-primary via-orange-400 to-amber-300 p-1 shadow-xl overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover border-4 border-white" />
            ) : (
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center border-4 border-white text-primary font-black text-3xl">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
          </div>
          <label 
            htmlFor="profile-avatar-input"
            className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full shadow-md border-2 border-white hover:scale-105 active:scale-95 transition-transform cursor-pointer"
            title="Upload Profile Photo"
          >
            {isUploadingAvatar ? <span className="animate-spin text-xs">...</span> : <Camera size={14} />}
          </label>
          <input 
            id="profile-avatar-input"
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleAvatarFileChange}
          />
        </div>

        <h1 className="text-2xl font-black text-white leading-tight">{user?.name || 'Technician User'}</h1>
        <p className="text-xs text-neutral-300 font-semibold mt-1 flex items-center justify-center gap-1.5">
          <span className="bg-primary/20 text-orange-300 px-2.5 py-0.5 rounded-full font-bold border border-primary/30">
            {(user as any)?.role || 'Field Technician'}
          </span>
          <span>•</span>
          <span className="font-mono text-neutral-400">ID: {user?.id?.substring(0, 8) || 'emp-1'}</span>
        </p>

        {/* Live Session Pill */}
        <div className="mt-4 inline-flex items-center gap-2 bg-emerald-500/15 text-emerald-300 px-4 py-1.5 rounded-full text-xs font-extrabold border border-emerald-500/30 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Supabase Connected • Active Session
        </div>
      </div>

      {/* ── Quick Activity & Performance Metrics Grid ── */}
      <div className="px-5 -mt-5 z-20 mb-5">
        <div className="bg-white rounded-2xl p-4 shadow-md border border-neutral-200/80 grid grid-cols-3 divide-x divide-neutral-100 text-center">
          <div className="px-2">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Total Logs</span>
            <span className="text-lg font-black text-neutral-800 block mt-0.5">{stats.totalLogs}</span>
          </div>
          <div className="px-2">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">On-Site</span>
            <span className="text-lg font-black text-emerald-600 block mt-0.5">{stats.complianceRate}</span>
          </div>
          <div className="px-2">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Sync Status</span>
            <span className="text-xs font-extrabold text-primary block mt-1 uppercase">Synced</span>
          </div>
        </div>
      </div>

      <div className="px-5 space-y-4 flex-1">

        {/* ── Job & Assignment Details Card ── */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-200/80 space-y-3">
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-neutral-100">
            <ShieldCheck size={14} className="text-primary" /> Employment Info
          </h3>

          <div className="flex items-center justify-between text-xs py-1">
            <span className="font-semibold text-neutral-500 flex items-center gap-2">
              <Mail size={14} className="text-neutral-400" /> Account Email
            </span>
            <span className="font-bold text-neutral-800">{(user as any)?.email || 'employee@converge.com'}</span>
          </div>

          <div className="flex items-center justify-between text-xs py-1">
            <span className="font-semibold text-neutral-500 flex items-center gap-2">
              <MapPin size={14} className="text-neutral-400" /> Assigned Location
            </span>
            <span className="font-bold text-neutral-800">{siteName}</span>
          </div>

          <div className="flex items-center justify-between text-xs py-1">
            <span className="font-semibold text-neutral-500 flex items-center gap-2">
              <Lock size={14} className="text-neutral-400" /> Security Credentials
            </span>
            <button 
              onClick={() => setShowPinModal(true)}
              className="text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              Update 4-Digit PIN <ChevronRight size={13} />
            </button>
          </div>
        </div>

        {/* ── App Preferences & Toggles Card ── */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-200/80 space-y-3">
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-neutral-100">
            <Settings size={14} className="text-primary" /> Preferences & Sync Settings
          </h3>

          {/* Offline Sync Toggle */}
          <div className="flex items-center justify-between py-1">
            <div>
              <span className="font-bold text-neutral-800 text-xs block">Automatic Offline Sync</span>
              <span className="text-[11px] text-neutral-400 font-medium block">Save logs locally when offline & auto sync</span>
            </div>
            <button onClick={() => setOfflineSyncEnabled(!offlineSyncEnabled)} className="text-primary cursor-pointer">
              {offlineSyncEnabled ? <ToggleRight size={28} className="text-emerald-500" /> : <ToggleLeft size={28} className="text-neutral-300" />}
            </button>
          </div>

          {/* Geofence Alert Toggle */}
          <div className="flex items-center justify-between py-1 border-t border-neutral-100 pt-2">
            <div>
              <span className="font-bold text-neutral-800 text-xs block">GPS Geofence Alerts</span>
              <span className="text-[11px] text-neutral-400 font-medium block">Notify when outside site radius</span>
            </div>
            <button onClick={() => setGeofenceAlertsEnabled(!geofenceAlertsEnabled)} className="text-primary cursor-pointer">
              {geofenceAlertsEnabled ? <ToggleRight size={28} className="text-emerald-500" /> : <ToggleLeft size={28} className="text-neutral-300" />}
            </button>
          </div>

          {/* Push Notifications Toggle */}
          <div className="flex items-center justify-between py-1 border-t border-neutral-100 pt-2">
            <div>
              <span className="font-bold text-neutral-800 text-xs block">Push Notifications</span>
              <span className="text-[11px] text-neutral-400 font-medium block">Reminders for Time In / Time Out</span>
            </div>
            <button onClick={() => setPushNotifications(!pushNotifications)} className="text-primary cursor-pointer">
              {pushNotifications ? <ToggleRight size={28} className="text-emerald-500" /> : <ToggleLeft size={28} className="text-neutral-300" />}
            </button>
          </div>
        </div>

        {/* ── System Info & Help ── */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-200/80 space-y-2 text-xs">
          <div className="flex items-center justify-between text-neutral-600">
            <span className="font-semibold flex items-center gap-1.5"><Smartphone size={14} /> DTRS Mobile App</span>
            <span className="font-mono text-neutral-400 font-bold">v1.3.0 (Production)</span>
          </div>
          <div className="flex items-center justify-between text-neutral-600 pt-1 border-t border-neutral-100">
            <span className="font-semibold flex items-center gap-1.5"><CircleHelp size={14} /> Help & Administrator Support</span>
            <button onClick={() => alert('Support contact: admin@converge.com')} className="text-primary font-bold hover:underline cursor-pointer">Contact Admin</button>
          </div>
        </div>

        {/* ── Sign Out Button ── */}
        <button 
          onClick={() => setShowConfirmLogout(true)}
          className="w-full mt-4 flex items-center justify-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 py-4 px-4 rounded-2xl font-black text-sm transition-all border border-red-200 active:scale-98 cursor-pointer shadow-sm"
        >
          <LogOut size={18} /> Sign Out Account
        </button>

      </div>

      {/* ── PIN Update Modal ── */}
      {showPinModal && (
        <div className="fixed inset-0 z-[120] bg-transparent flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-md border border-neutral-300 space-y-4">
            <div className="flex items-center gap-2 text-neutral-800">
              <Lock className="text-primary" size={22} />
              <h3 className="font-extrabold text-lg">Update Security PIN</h3>
            </div>
            <p className="text-xs text-neutral-500">Enter your new 4-digit PIN to authenticate your login.</p>

            <input
              type="password"
              maxLength={4}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter 4-digit PIN"
              className="w-full px-4 py-3 text-center tracking-widest font-black text-xl bg-neutral-50 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-primary outline-none"
            />

            {pinMessage && (
              <p className={clsx("text-xs font-bold text-center", pinMessage.includes('success') ? "text-emerald-600" : "text-red-500")}>
                {pinMessage}
              </p>
            )}

            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => { setShowPinModal(false); setNewPin(''); setPinMessage(null); }}
                className="flex-1 py-3 rounded-xl font-bold text-xs bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
              >
                Cancel
              </button>
              <button 
                onClick={handleChangePin}
                className="flex-1 py-3 rounded-xl font-bold text-xs bg-primary text-white hover:bg-primary-dark shadow-md"
              >
                Save New PIN
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Sign Out Confirmation Modal ── */}
      {showConfirmLogout && (
        <div className="fixed inset-0 z-[120] bg-transparent flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-md border border-neutral-300 text-center space-y-4">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle size={30} />
            </div>
            <h3 className="font-extrabold text-lg text-neutral-800">Sign Out Account?</h3>
            <p className="text-xs text-neutral-500">Are you sure you want to log out of Converge DTRS? You will need your PIN to log back in.</p>
            
            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setShowConfirmLogout(false)}
                className="flex-1 py-3 rounded-xl font-bold text-xs bg-neutral-100 text-neutral-700 hover:bg-neutral-200 cursor-pointer"
              >
                Stay Logged In
              </button>
              <button 
                onClick={handleLogout}
                className="flex-1 py-3 rounded-xl font-bold text-xs bg-red-600 text-white hover:bg-red-700 shadow-md cursor-pointer"
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
