import { useState } from 'react';
import { RefreshCw, Database, Clock, Check, AlertTriangle } from 'lucide-react';

export default function SyncMonitor() {
  const pendingRecords = [
    { id: 'abc-123', employee: 'John Dela Cruz', type: 'Time In', createdAt: '2026-08-25 06:55 AM', retries: 0, status: 'pending' },
    { id: 'def-456', employee: 'Maria Santos', type: 'Time Out', createdAt: '2026-08-25 05:00 PM', retries: 2, status: 'failed' },
    { id: 'ghi-789', employee: 'Eric Reyes', type: 'Time In', createdAt: '2026-08-25 07:10 AM', retries: 1, status: 'pending' },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">Sync Monitor</h1>
          <p className="text-neutral-500 mt-1">Track offline records waiting to be synchronized</p>
        </div>
        <button className="flex items-center gap-2 bg-secondary hover:bg-secondary-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <RefreshCw size={16} /> Force Sync Now
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center"><Clock size={22} /></div>
          <div>
            <p className="text-xs text-neutral-500">Pending</p>
            <p className="text-2xl font-black text-neutral-800">2</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-red-100 text-red-600 flex items-center justify-center"><AlertTriangle size={22} /></div>
          <div>
            <p className="text-xs text-neutral-500">Failed</p>
            <p className="text-2xl font-black text-neutral-800">1</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-green-100 text-green-600 flex items-center justify-center"><Check size={22} /></div>
          <div>
            <p className="text-xs text-neutral-500">Synced Today</p>
            <p className="text-2xl font-black text-neutral-800">12</p>
          </div>
        </div>
      </div>

      {/* Queue Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-neutral-100 flex items-center gap-2 bg-neutral-50/50">
          <Database size={18} className="text-neutral-400" />
          <h2 className="text-sm font-semibold text-neutral-700">IndexedDB Queue</h2>
          <span className="ml-auto text-xs text-neutral-400">Unsynced records stored locally</span>
        </div>
        <table className="w-full text-sm text-left">
          <thead className="bg-neutral-50 text-neutral-600 font-semibold border-b border-neutral-200">
            <tr>
              <th className="px-6 py-4">Local ID</th>
              <th className="px-6 py-4">Employee</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Created At</th>
              <th className="px-6 py-4">Retries</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {pendingRecords.map((r) => (
              <tr key={r.id} className="hover:bg-neutral-50">
                <td className="px-6 py-4 font-mono text-xs text-neutral-500">{r.id}</td>
                <td className="px-6 py-4 font-medium text-neutral-800">{r.employee}</td>
                <td className="px-6 py-4 text-primary font-medium">{r.type}</td>
                <td className="px-6 py-4 text-neutral-500 whitespace-nowrap">{r.createdAt}</td>
                <td className="px-6 py-4 text-neutral-600">{r.retries}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    r.status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
