import { Shield, Bell, Clock, RefreshCw, Save } from 'lucide-react';

export default function Settings() {
  return (
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
        <div className="space-y-4">
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
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-xs font-extrabold text-navy-900">Allow Outside-Geofence Submission</p>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">If enabled, flagged records are submitted but marked for review</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
            </label>
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
  );
}
