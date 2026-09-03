import { useState } from 'react';
import { Filter, Download, Eye, MapPin } from 'lucide-react';
import { clsx } from 'clsx';

export default function AdminAttendance() {
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

  // Mock data representing Supabase data
  const records = [
    { id: 1, name: 'John Dela Cruz', team: 'Team Alpha', site: 'Makati Tower', type: 'Time In', time: '08:55 AM', status: 'Verified On Site', dist: '28m', sync: 'Synced' },
    { id: 2, name: 'Maria Santos', team: 'Team Alpha', site: 'BGC Site', type: 'Time In', time: '08:50 AM', status: 'Verified On Site', dist: '35m', sync: 'Synced' },
    { id: 3, name: 'Ana Garcia', team: 'Team Beta', site: 'Ortigas Hub', type: 'Time In', time: '08:45 AM', status: 'Outside Allowed Area', dist: '152m', sync: 'Pending' },
  ];

  return (
    <div className="max-w-6xl mx-auto flex gap-6">
      {/* Table Section */}
      <div className={clsx("transition-all duration-300", selectedRecord ? "w-2/3" : "w-full")}>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-neutral-800">Attendance Records</h1>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 bg-white border border-neutral-300 px-4 py-2 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50">
              <Filter size={16} /> Filters
            </button>
            <button className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <Download size={16} /> Export
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-neutral-50 text-neutral-600 font-semibold border-b border-neutral-200">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Team</th>
                <th className="px-6 py-4">Site</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Time</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Sync</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {records.map((row) => (
                <tr key={row.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-neutral-900 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-bold">{row.name.charAt(0)}</div>
                    {row.name}
                  </td>
                  <td className="px-6 py-4 text-neutral-600">{row.team}</td>
                  <td className="px-6 py-4 text-neutral-600">{row.site}</td>
                  <td className="px-6 py-4 font-medium text-primary">{row.type}</td>
                  <td className="px-6 py-4 text-neutral-600">{row.time}</td>
                  <td className="px-6 py-4">
                    <span className={clsx("px-2.5 py-1 rounded-full text-xs font-bold", 
                      row.status.includes('Verified') ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                    )}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                     <span className={clsx("text-xs font-medium", row.sync === 'Synced' ? "text-green-600" : "text-orange-500")}>
                      {row.sync}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => setSelectedRecord(row)} className="p-1.5 text-neutral-400 hover:text-secondary hover:bg-secondary/10 rounded-lg transition-colors">
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Sidebar Panel */}
      {selectedRecord && (
        <div className="w-1/3 bg-white border border-neutral-200 rounded-xl shadow-sm p-6 relative flex flex-col h-[calc(100vh-8rem)] sticky top-0 overflow-y-auto">
          <button onClick={() => setSelectedRecord(null)} className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700">
             ✕
          </button>
          
          <h3 className="font-bold text-lg mb-6 text-neutral-800">Attendance Detail</h3>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-full bg-neutral-200 flex items-center justify-center text-xl font-bold">{selectedRecord.name.charAt(0)}</div>
            <div>
              <h4 className="font-bold text-neutral-900">{selectedRecord.name}</h4>
              <p className="text-sm text-neutral-500">Technician - {selectedRecord.team}</p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex justify-between border-b border-neutral-100 pb-2">
              <span className="text-sm text-neutral-500">Type</span>
              <span className="font-medium">{selectedRecord.type}</span>
            </div>
            <div className="flex justify-between border-b border-neutral-100 pb-2">
              <span className="text-sm text-neutral-500">Date & Time</span>
              <span className="font-medium">May 20, 2024 {selectedRecord.time}</span>
            </div>
            <div className="flex justify-between border-b border-neutral-100 pb-2">
              <span className="text-sm text-neutral-500">Site</span>
              <span className="font-medium">{selectedRecord.site}</span>
            </div>
            <div className="flex justify-between border-b border-neutral-100 pb-2">
              <span className="text-sm text-neutral-500">Distance</span>
              <span className="font-medium">{selectedRecord.dist}</span>
            </div>
          </div>

          <div className="mt-auto">
            <p className="text-sm font-semibold text-neutral-700 mb-2">Captured Evidence</p>
            <div className="aspect-video bg-neutral-100 rounded-lg flex items-center justify-center text-neutral-400 mb-2">
               [Photo Preview]
            </div>
            <div className="aspect-video bg-neutral-100 rounded-lg flex items-center justify-center text-neutral-400 relative overflow-hidden">
               <MapPin size={24} className="text-primary z-10" />
               <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#444 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
