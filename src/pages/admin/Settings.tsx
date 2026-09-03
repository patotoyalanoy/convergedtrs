import { Shield, Bell, Clock, RefreshCw, Save } from 'lucide-react';

export default function Settings() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-800">System Settings</h1>
        <p className="text-neutral-500 mt-1">Configure attendance policies and application behaviour</p>
      </div>

      {/* Attendance Policy */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6 mb-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Clock size={20} />
          </div>
          <h2 className="font-bold text-neutral-800">Attendance Policy</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Default Geofence Radius (meters)</label>
            <input type="number" defaultValue={100} className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 text-sm focus:ring-2 focus:ring-primary focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Min GPS Accuracy Threshold (meters)</label>
            <input type="number" defaultValue={100} className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 text-sm focus:ring-2 focus:ring-primary focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Time In Window Start</label>
            <input type="time" defaultValue="06:00" className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 text-sm focus:ring-2 focus:ring-primary focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Time In Window End</label>
            <input type="time" defaultValue="10:00" className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 text-sm focus:ring-2 focus:ring-primary focus:border-primary" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Min Interval Between Records (minutes)</label>
            <input type="number" defaultValue={30} className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 text-sm focus:ring-2 focus:ring-primary focus:border-primary" />
            <p className="text-xs text-neutral-400 mt-1">Prevents duplicate Time In/Out submissions within this period.</p>
          </div>
        </div>
      </div>

      {/* Sync Settings */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6 mb-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
            <RefreshCw size={20} />
          </div>
          <h2 className="font-bold text-neutral-800">Synchronization Settings</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Auto-Sync Interval (seconds)</label>
            <input type="number" defaultValue={60} className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 text-sm focus:ring-2 focus:ring-primary focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Max Retry Attempts</label>
            <input type="number" defaultValue={3} className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 text-sm focus:ring-2 focus:ring-primary focus:border-primary" />
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6 mb-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
            <Shield size={20} />
          </div>
          <h2 className="font-bold text-neutral-800">Security Settings</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-neutral-100">
            <div>
              <p className="text-sm font-medium text-neutral-800">PIN Lockout After Failed Attempts</p>
              <p className="text-xs text-neutral-400 mt-0.5">Lock employee out after N consecutive failed PIN tries</p>
            </div>
            <input type="number" defaultValue={5} className="w-20 px-3 py-2 rounded-lg border border-neutral-300 text-sm text-center focus:ring-2 focus:ring-primary" />
          </div>
          <div className="flex items-center justify-between py-3 border-b border-neutral-100">
            <div>
              <p className="text-sm font-medium text-neutral-800">Session Timeout (minutes)</p>
              <p className="text-xs text-neutral-400 mt-0.5">Auto-logout after inactivity</p>
            </div>
            <input type="number" defaultValue={30} className="w-20 px-3 py-2 rounded-lg border border-neutral-300 text-sm text-center focus:ring-2 focus:ring-primary" />
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-neutral-800">Allow Outside-Geofence Submission</p>
              <p className="text-xs text-neutral-400 mt-0.5">If enabled, flagged records are submitted but marked for review</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-neutral-200 peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6 mb-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
            <Bell size={20} />
          </div>
          <h2 className="font-bold text-neutral-800">Notifications</h2>
        </div>
        <div className="space-y-4">
          {['Notify admin on Outside Geofence record', 'Notify admin on sync failure', 'Daily attendance summary report'].map((item) => (
            <div key={item} className="flex items-center justify-between py-2">
              <p className="text-sm text-neutral-700">{item}</p>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-neutral-200 peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-bold text-sm transition-colors">
          <Save size={18} /> Save Settings
        </button>
      </div>
    </div>
  );
}
