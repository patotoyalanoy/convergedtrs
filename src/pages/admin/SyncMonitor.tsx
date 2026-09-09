import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/indexeddb/db';
import { SyncService } from '@/services/sync/syncService';
import { useAppStore } from '@/stores/useAppStore';
import { RefreshCw, Database, Clock, Check, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';

export default function SyncMonitor() {
  const isSyncing = useAppStore((state) => state.isSyncing);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Query live IndexedDB records
  const localRecords = useLiveQuery(() => db.attendanceQueue.toArray()) || [];

  const pendingCount = localRecords.filter(r => r.syncStatus === 'pending').length;
  const failedCount = localRecords.filter(r => r.syncStatus === 'failed').length;
  const syncedCount = localRecords.filter(r => r.syncStatus === 'synced').length;

  const handleForceSync = async () => {
    setSyncMessage(null);
    try {
      await SyncService.syncPendingRecords();
      setSyncMessage({ type: 'success', text: 'Sync completed successfully!' });
      setTimeout(() => setSyncMessage(null), 4000);
    } catch (err: any) {
      console.error('Force sync error:', err);
      setSyncMessage({ type: 'error', text: err?.message || 'Failed to force sync. Please check network connection.' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-black text-navy-900 tracking-tight">Sync Monitor</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-semibold">Track offline IndexedDB queue records and trigger manual Supabase synchronization</p>
        </div>
        <button
          onClick={handleForceSync}
          disabled={isSyncing}
          className={clsx(
            "flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl text-xs font-black shadow-sm transition-all active:scale-95 cursor-pointer",
            isSyncing && "opacity-60 cursor-not-allowed active:scale-100"
          )}
        >
          <RefreshCw size={15} className={clsx(isSyncing && "animate-spin")} />
          {isSyncing ? 'Syncing...' : 'Force Sync Now'}
        </button>
      </div>

      {syncMessage && (
        <div className={clsx(
          "mb-6 p-4 rounded-2xl flex items-center gap-2.5 text-xs font-bold border shadow-xs transition-all",
          syncMessage.type === 'success' 
            ? "bg-emerald-50 text-emerald-900 border-emerald-200/80" 
            : "bg-red-50 text-red-900 border-red-200/80"
        )}>
          {syncMessage.type === 'success' ? <CheckCircle2 size={18} className="text-emerald-600" /> : <AlertCircle size={18} className="text-red-600" />}
          <span>{syncMessage.text}</span>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center font-bold">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Pending</p>
            <p className="text-2xl font-black text-navy-900">{pendingCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 border border-red-100 flex items-center justify-center font-bold">
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Failed</p>
            <p className="text-2xl font-black text-navy-900">{failedCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center font-bold">
            <Check size={20} />
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Synced Records</p>
            <p className="text-2xl font-black text-navy-900">{syncedCount}</p>
          </div>
        </div>
      </div>

      {/* Queue Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-x-auto">
        <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/60">
          <Database size={17} className="text-primary" />
          <h2 className="text-xs font-black text-navy-900">IndexedDB Local Offline Queue</h2>
          <span className="ml-auto text-xs font-bold text-navy-900 bg-navy-50 px-3 py-1 rounded-xl border border-navy-100">
            {localRecords.length} local record{localRecords.length !== 1 ? 's' : ''}
          </span>
        </div>
        
        {localRecords.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm font-medium">
            <CheckCircle2 size={36} className="mx-auto mb-2 text-emerald-500" />
            <p className="font-extrabold text-navy-900">No unsynced offline records in local storage.</p>
            <p className="text-xs text-slate-400 mt-1">When attendance is recorded offline, entries will queue here automatically.</p>
          </div>
        ) : (
          <table className="w-full min-w-[700px] text-sm text-left">
            <thead className="bg-[#0B192C] text-white font-extrabold border-b border-navy-800 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Local ID</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Location / Team</th>
                <th className="px-6 py-4">Recorded At</th>
                <th className="px-6 py-4">Retries</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {localRecords.map((r) => (
                <tr key={r.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-neutral-500">
                    {r.id.slice(0, 8)}...
                  </td>
                  <td className="px-6 py-4">
                    <span className={clsx(
                      "px-2.5 py-1 rounded-md text-xs font-extrabold",
                      r.type === 'TIME_IN' ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                    )}>
                      {r.type === 'TIME_IN' ? 'Time In' : 'Time Out'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-neutral-800">
                    <div>{r.locationName || 'Field Site'}</div>
                    <div className="text-xs text-neutral-400">{r.teamName || 'Technician Team'}</div>
                  </td>
                  <td className="px-6 py-4 text-neutral-500 whitespace-nowrap text-xs">
                    {new Date(r.recordedAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-neutral-600 font-bold">{r.syncRetryCount || 0}</td>
                  <td className="px-6 py-4">
                    <span className={clsx(
                      "px-3 py-1 rounded-full text-xs font-bold capitalize",
                      r.syncStatus === 'pending' && "bg-amber-100 text-amber-700 border border-amber-300",
                      r.syncStatus === 'failed' && "bg-red-100 text-red-700 border border-red-300",
                      r.syncStatus === 'synced' && "bg-emerald-100 text-emerald-700 border border-emerald-300",
                      r.syncStatus === 'syncing' && "bg-blue-100 text-blue-700 border border-blue-300 animate-pulse"
                    )}>
                      {r.syncStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
