import { Users, LogIn, LogOut, AlertTriangle, RefreshCw } from 'lucide-react';

export default function AdminDashboard() {
  const stats = [
    { label: 'Total Employees', value: '16', icon: Users, color: 'text-blue-500', bg: 'bg-blue-100' },
    { label: 'Time In Today', value: '12', icon: LogIn, color: 'text-green-500', bg: 'bg-green-100' },
    { label: 'Time Out Today', value: '6', icon: LogOut, color: 'text-neutral-500', bg: 'bg-neutral-100' },
    { label: 'Missing / Outside', value: '4', icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-100' },
    { label: 'Pending Sync', value: '3', icon: RefreshCw, color: 'text-primary', bg: 'bg-primary/10' },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-neutral-800">Dashboard Overview</h1>
        <div className="flex items-center gap-2">
          <input type="date" className="border border-neutral-300 rounded-lg px-3 py-2 text-sm text-neutral-600" defaultValue={new Date().toISOString().split('T')[0]} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-5 rounded-xl border border-neutral-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500 mb-1">{stat.label}</p>
              <h3 className="text-2xl font-bold text-neutral-800">{stat.value}</h3>
            </div>
            <div className={`w-12 h-12 rounded-full ${stat.bg} flex items-center justify-center ${stat.color}`}>
              <stat.icon size={24} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Mockup */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-neutral-100 shadow-sm p-6">
          <h2 className="font-bold text-neutral-800 mb-4">Today's Attendance Overview</h2>
          <div className="h-64 flex items-center justify-center bg-neutral-50 rounded-lg border border-dashed border-neutral-200">
            <p className="text-neutral-400">Chart Visualization (Recharts/Chart.js)</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-6">
          <h2 className="font-bold text-neutral-800 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start gap-3 pb-4 border-b border-neutral-50 last:border-0">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs mt-0.5">JD</div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-neutral-800">John Dela Cruz</p>
                  <p className="text-xs text-neutral-500">Time In - Makati Tower</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-neutral-500">08:55 AM</p>
                  <span className="text-[10px] font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Synced</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
