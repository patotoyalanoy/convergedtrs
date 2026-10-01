import { useState } from 'react';
import { Shield, Bell, Clock, RefreshCw, Save, Lock, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { supabase } from '@/lib/supabase/client';
import { clsx } from 'clsx';

export default function Settings() {
  const { user } = useAuthStore();

  // ── Change Admin PIN state ──
  const [showPinModal, setShowPinModal] = useState(false);
  const [newPin, setNewPin]             = useState('');
  const [confirmPin, setConfirmPin]     = useState('');
  const [pinMessage, setPinMessage]     = useState<string | null>(null);
  const [pinLoading, setPinLoading]     = useState(false);
  const [pinSuccess, setPinSuccess]     = useState(false);

  const handleChangeAdminPin = async () => {
    if (newPin.length !== 4) {
      setPinMessage('PIN must be exactly 4 digits.');
      return;
    }
    if (newPin !== confirmPin) {
      setPinMessage('PINs do not match. Please re-enter.');
      return;
    }
    setPinLoading(true);
    try {
      const { error } = await supabase
        .from('admin_users')
        .update({ pin_hash: newPin })
        .eq('id', user?.id || '');

      if (error) throw error;

      setPinSuccess(true);
      setPinMessage('Admin PIN updated successfully!');
      setTimeout(() => {
        setShowPinModal(false);
        setNewPin('');
        setConfirmPin('');
        setPinMessage(null);
        setPinSuccess(false);
      }, 1400);
    } catch (e: any) {
      setPinMessage(e.message || 'Failed to update PIN. Please try again.');
    } finally {
      setPinLoading(false);
    }
  };

  const closePinModal = () => {
    setShowPinModal(false);
    setNewPin('');
    setConfirmPin('');
    setPinMessage(null);
    setPinSuccess(false);
  };

  return (
    <>
      {/* ── Page Content ── */}
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-navy-900 tracking-tight">System Settings</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-semibold">Configure attendance policies, synchronization timers, and security thresholds</p>
        </div>

        {/* Attendance Policy */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 mb-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-navy-900 text-white flex items-center justify-center shadow-2xs">
              <Clock size={19} />
            </div>
            <h2 className="font-extrabold text-navy-900 text-sm">Attendance Policy</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-navy-900 mb-1.5">Default Geofence Radius (meters)</label>
              <input type="number" defaultValue={100} className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-navy-900 focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-navy-900 mb-1.5">Min GPS Accuracy Threshold (meters)</label>
              <input type="number" defaultValue={100} className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-navy-900 focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-navy-900 mb-1.5">Time In Window Start</label>
              <input type="time" defaultValue="06:00" className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-navy-900 focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-navy-900 mb-1.5">Time In Window End</label>
              <input type="time" defaultValue="10:00" className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-navy-900 focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white outline-none" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-navy-900 mb-1.5">Min Interval Between Records (minutes)</label>
              <input type="number" defaultValue={30} className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-navy-900 focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white outline-none" />
              <p className="text-[11px] text-slate-400 mt-1 font-medium">Prevents duplicate Time In/Out submissions within this period.</p>
            </div>
          </div>
        </div>

        {/* Sync Settings */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 mb-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-navy-900 text-white flex items-center justify-center shadow-2xs">
              <RefreshCw size={19} />
            </div>
            <h2 className="font-extrabold text-navy-900 text-sm">Synchronization Settings</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-navy-900 mb-1.5">Auto-Sync Interval (seconds)</label>
              <input type="number" defaultValue={60} className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-navy-900 focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-navy-900 mb-1.5">Max Retry Attempts</label>
              <input type="number" defaultValue={3} className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-navy-900 focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white outline-none" />
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 mb-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-navy-900 text-white flex items-center justify-center shadow-2xs">
              <Shield size={19} />
            </div>
            <h2 className="font-extrabold text-navy-900 text-sm">Security Settings</h2>
          </div>
          <div className="space-y-0">
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <div>
                <p className="text-xs font-extrabold text-navy-900">PIN Lockout After Failed Attempts</p>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">Lock employee out after N consecutive failed PIN tries</p>
              </div>
              <input type="number" defaultValue={5} className="w-20 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-extrabold text-navy-900 text-center focus:ring-2 focus:ring-primary/30 outline-none" />
            </div>

            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <div>
                <p className="text-xs font-extrabold text-navy-900">Session Timeout (minutes)</p>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">Auto-logout after inactivity</p>
              </div>
              <input type="number" defaultValue={30} className="w-20 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-extrabold text-navy-900 text-center focus:ring-2 focus:ring-primary/30 outline-none" />
            </div>

            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <div>
                <p className="text-xs font-extrabold text-navy-900">Allow Outside-Geofence Submission</p>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">If enabled, flagged records are submitted but marked for review</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>

            {/* ── Change Admin PIN Row ── */}
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-xs font-extrabold text-navy-900">Admin Login PIN</p>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">Update your 4-digit PIN used to access the admin panel</p>
              </div>
              <button
                onClick={() => setShowPinModal(true)}
                className="flex items-center gap-1.5 text-xs font-black text-white bg-navy-900 hover:bg-navy-800 px-3.5 py-2 rounded-xl shadow-sm transition-all duration-150 active:scale-95 cursor-pointer"
              >
                <Lock size={13} /> Change PIN
              </button>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 mb-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-navy-900 text-white flex items-center justify-center shadow-2xs">
              <Bell size={19} />
            </div>
            <h2 className="font-extrabold text-navy-900 text-sm">Notifications</h2>
          </div>
          <div className="space-y-4">
            {['Notify admin on Outside Geofence record', 'Notify admin on sync failure', 'Daily attendance summary report'].map((item) => (
              <div key={item} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <p className="text-xs font-bold text-navy-900">{item}</p>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-xl font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer">
            <Save size={16} /> Save System Settings
          </button>
        </div>
      </div>

      {/* ── Change Admin PIN Modal ─────────────────────────────────────────────
          Rendered OUTSIDE the scrollable page div so it isn't clipped by
          the AdminLayout's overflow-hidden main container.
      ─────────────────────────────────────────────────────────────────────── */}
      {showPinModal && (
        <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-slate-200 overflow-hidden">

            {/* Modal Header */}
            <div className="bg-[#0B192C] px-6 py-5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 text-white flex items-center justify-center shrink-0">
                <Lock size={18} />
              </div>
              <div>
                <h3 className="font-black text-white text-sm leading-tight">Change Admin PIN</h3>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">Update your 4-digit login PIN</p>
              </div>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 space-y-4">

              {/* New PIN */}
              <div>
                <label className="block text-xs font-extrabold text-navy-900 mb-1.5">New PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={newPin}
                  onChange={(e) => { setNewPin(e.target.value.replace(/\D/g, '')); setPinMessage(null); }}
                  placeholder="● ● ● ●"
                  className="w-full px-4 py-3 text-center tracking-[0.6em] font-black text-2xl bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
                />
              </div>

              {/* Confirm PIN */}
              <div>
                <label className="block text-xs font-extrabold text-navy-900 mb-1.5">Confirm New PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={confirmPin}
                  onChange={(e) => { setConfirmPin(e.target.value.replace(/\D/g, '')); setPinMessage(null); }}
                  placeholder="● ● ● ●"
                  className="w-full px-4 py-3 text-center tracking-[0.6em] font-black text-2xl bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
                />
              </div>

              {/* PIN dot preview */}
              <div className="flex justify-center gap-3 py-1">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={clsx(
                      'w-3 h-3 rounded-full border-2 transition-all duration-150',
                      i < newPin.length
                        ? 'bg-primary border-primary scale-110'
                        : 'border-slate-300 bg-white'
                    )}
                  />
                ))}
              </div>

              {/* Feedback */}
              {pinMessage && (
                <div className={clsx(
                  'flex items-center gap-2 text-xs font-bold px-3 py-2.5 rounded-xl',
                  pinSuccess
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-red-50 text-red-600 border border-red-200'
                )}>
                  {pinSuccess && <CheckCircle2 size={14} className="shrink-0" />}
                  {pinMessage}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2.5 pt-1">
                <button
                  onClick={closePinModal}
                  disabled={pinLoading}
                  className="flex-1 py-3 rounded-xl font-bold text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-50 active:scale-[0.97]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleChangeAdminPin}
                  disabled={pinLoading || newPin.length !== 4 || confirmPin.length !== 4}
                  className="flex-1 py-3 rounded-xl font-black text-xs bg-[#0B192C] hover:bg-[#162A45] text-white shadow-md transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97]"
                >
                  {pinLoading ? 'Saving…' : 'Save New PIN'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
