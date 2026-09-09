import { useState, useEffect } from 'react';
import { Filter, Download, Eye, MapPin, Search, Calendar, RefreshCw, Trash2, AlertTriangle, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';
import { fetchAllAttendanceRecords, filterRecordsByRange, deleteAttendanceRecord, DateRangeOption } from '@/services/attendanceApi';
import { exportAttendanceToCSV, FormattedAttendanceRecord } from '@/utils/exportUtils';
import AdminRecordMap from '@/components/maps/AdminRecordMap';

function PhotoCard({ photoUrl, onEnlarge }: { photoUrl: string; onEnlarge: (url: string) => void }) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className="aspect-video bg-neutral-100 rounded-xl border border-neutral-200 flex flex-col items-center justify-center text-neutral-400 text-xs gap-1 p-4 text-center">
        <ImageIcon size={24} className="text-neutral-300" />
        <span className="font-semibold text-neutral-600">Photo Evidence Synced</span>
        <span className="text-[10px] text-neutral-400">Preview file unavailable</span>
      </div>
    );
  }

  return (
    <div 
      onClick={() => onEnlarge(photoUrl)}
      className="relative group cursor-pointer overflow-hidden rounded-xl border border-neutral-200 shadow-2xs bg-neutral-100"
    >
      <img 
        src={photoUrl} 
        alt="Attendance photo evidence" 
        className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-300"
        onError={() => setError(true)}
      />
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5">
        <Eye size={14} /> Tap to Enlarge
      </div>
    </div>
  );
}

export default function AdminAttendance() {
  const [records, setRecords] = useState<FormattedAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<FormattedAttendanceRecord | null>(null);
  const [deletingRecordId, setDeletingRecordId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRangeOption>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'TIME_IN' | 'TIME_OUT'>('ALL');
  const [toast, setToast] = useState<string | null>(null);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = async () => {
    setLoading(true);
    const data = await fetchAllAttendanceRecords();
    setRecords(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: string) => {
    const success = await deleteAttendanceRecord(id);
    if (success) {
      setRecords(prev => prev.filter(r => r.id !== id));
      if (selectedRecord?.id === id) {
        setSelectedRecord(null);
      }
      showToast('Attendance record deleted successfully');
    } else {
      alert('Failed to delete attendance record');
    }
    setDeletingRecordId(null);
  };

  // Filter records based on selected range, type filter, and search
  const rangeFiltered = filterRecordsByRange(records, dateRange);
  const filteredRecords = rangeFiltered.filter(r => {
    const matchesSearch = r.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.siteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.teamName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'ALL' || r.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleExportCSV = () => {
    const rangeLabel = dateRange === '15days' ? '15_days' : dateRange === '30days' ? '30_days' : dateRange === 'today' ? 'today' : 'all';
    exportAttendanceToCSV(filteredRecords, `attendance_records_${rangeLabel}.csv`);
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6 relative">

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] bg-neutral-900/95 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-black border border-neutral-700 animate-bounce">
          <CheckCircle2 size={18} className="text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Table Section */}
      <div className={clsx("transition-all duration-300", selectedRecord ? "w-full lg:w-2/3" : "w-full")}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-black text-navy-900 tracking-tight">Attendance Logs</h1>
            <p className="text-xs text-slate-500 mt-0.5 font-semibold">Monitor real-time technician field logs, GPS positions, and selfie evidence</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={loadData}
              title="Refresh Data"
              className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-navy-900 hover:bg-slate-100/80 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            >
              <RefreshCw size={13} className={clsx(loading && "animate-spin")} />
              Refresh
            </button>
            <button 
              onClick={handleExportCSV}
              className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl text-xs font-black shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <Download size={15} /> Export CSV
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search employee, team, site..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/30 focus:border-primary text-xs font-bold text-navy-900 outline-none bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Range Selector */}
            <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/80">
              <Calendar size={15} className="text-primary" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as DateRangeOption)}
                className="bg-transparent text-xs font-bold text-navy-900 outline-none cursor-pointer"
              >
                <option value="all">All Date Ranges</option>
                <option value="today">Today</option>
                <option value="15days">Last 15 Days</option>
                <option value="30days">Last 30 Days</option>
              </select>
            </div>

            {/* Type Selector (Time In / Time Out) */}
            <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/80">
              <Filter size={15} className="text-primary" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="bg-transparent text-xs font-bold text-navy-900 outline-none cursor-pointer"
              >
                <option value="ALL">All Types (In & Out)</option>
                <option value="TIME_IN">Time In Only</option>
                <option value="TIME_OUT">Time Out Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Attendance Records Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-2 font-medium">
              <RefreshCw size={24} className="animate-spin text-primary" />
              <span>Fetching live attendance records from database...</span>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="p-12 text-center text-slate-500 font-medium">
              No attendance records found matching your filters.
            </div>
          ) : (
            <table className="w-full min-w-[800px] text-sm text-left">
              <thead className="bg-[#0B192C] text-white font-extrabold border-b border-navy-800 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Team</th>
                  <th className="px-6 py-4">Location & Site</th>
                  <th className="px-6 py-4">Members Present</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((row) => (
                  <tr key={row.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-neutral-900 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                        {row.employeeName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-neutral-900">{row.employeeName}</p>
                        <p className="text-xs text-neutral-400">{row.role || 'Technician'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-neutral-600">{row.teamName}</td>
                    <td className="px-6 py-4 text-neutral-600">
                      <div className="font-semibold text-neutral-800 text-xs">{row.locationName || row.siteName}</div>
                      <div className="text-[11px] text-neutral-400 font-normal">{row.siteName}</div>
                    </td>
                    <td className="px-6 py-4">
                      {row.membersPresent && row.membersPresent.length > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                          👥 {row.membersPresent.length} Member{row.membersPresent.length > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-400 font-medium">Solo check-in</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium">
                      <span className={clsx(
                        "px-2.5 py-1 rounded-md text-xs font-bold",
                        row.type === 'TIME_IN' ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                      )}>
                        {row.type === 'TIME_IN' ? 'Time In' : 'Time Out'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-neutral-600 whitespace-nowrap">
                      <div>{row.formattedDate}</div>
                      <div className="text-xs text-neutral-400">{row.formattedTime}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={clsx("px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap", 
                        row.verificationStatus.includes('Verified') ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                      )}>
                        {row.verificationStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button 
                          onClick={() => setSelectedRecord(row)} 
                          className="p-1.5 text-neutral-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" 
                          title="View Full Details"
                        >
                          <Eye size={17} />
                        </button>
                        <button 
                          onClick={() => setDeletingRecordId(row.id)} 
                          className="p-1.5 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                          title="Delete Record"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Detail Sidebar Panel */}
      {selectedRecord && (
        <div className="w-full lg:w-1/3 bg-white border border-neutral-200 rounded-xl shadow-sm p-6 relative flex flex-col h-auto lg:h-[calc(100vh-8rem)] sticky top-0 overflow-y-auto">
          <button onClick={() => setSelectedRecord(null)} className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 text-lg font-bold">
             ✕
          </button>
          
          <h3 className="font-bold text-lg mb-6 text-neutral-800">Attendance Details</h3>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold shrink-0">
              {selectedRecord.employeeName.charAt(0)}
            </div>
            <div>
              <h4 className="font-bold text-neutral-900">{selectedRecord.employeeName}</h4>
              <p className="text-sm text-neutral-500">{selectedRecord.role || 'Technician'} • {selectedRecord.teamName}</p>
            </div>
          </div>

          <div className="space-y-3 mb-6 text-xs">
            <div className="flex justify-between border-b border-neutral-100 pb-2">
              <span className="text-neutral-500">Record Type</span>
              <span className={clsx("font-bold", selectedRecord.type === 'TIME_IN' ? "text-emerald-600" : "text-blue-600")}>
                {selectedRecord.type === 'TIME_IN' ? 'TIME IN' : 'TIME OUT'}
              </span>
            </div>
            <div className="flex justify-between border-b border-neutral-100 pb-2">
              <span className="text-neutral-500">Field Location</span>
              <span className="font-bold text-neutral-800">{selectedRecord.locationName || selectedRecord.siteName}</span>
            </div>
            <div className="flex justify-between border-b border-neutral-100 pb-2">
              <span className="text-neutral-500">Assigned Site</span>
              <span className="font-medium text-neutral-700">{selectedRecord.siteName}</span>
            </div>
            <div className="flex justify-between border-b border-neutral-100 pb-2">
              <span className="text-neutral-500">Date & Time</span>
              <span className="font-medium text-neutral-800">{selectedRecord.formattedDate} at {selectedRecord.formattedTime}</span>
            </div>
            <div className="flex justify-between border-b border-neutral-100 pb-2">
              <span className="text-neutral-500">Geofence Status</span>
              <span className="font-bold text-emerald-600">{selectedRecord.verificationStatus}</span>
            </div>
            <div className="flex justify-between border-b border-neutral-100 pb-2">
              <span className="text-neutral-500">Proximity Distance</span>
              <span className="font-medium text-neutral-800">
                {selectedRecord.distanceFromSite !== null && selectedRecord.distanceFromSite !== undefined 
                  ? `${Math.round(selectedRecord.distanceFromSite)}m` 
                  : 'N/A'}
              </span>
            </div>
          </div>

          {/* Members Included Section */}
          <div className="mb-6 bg-neutral-50 p-4 rounded-xl border border-neutral-200/80">
            <h5 className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              👥 Included Team Members ({selectedRecord.membersPresent?.length || 0})
            </h5>
            {selectedRecord.membersPresent && selectedRecord.membersPresent.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {selectedRecord.membersPresent.map((m, idx) => (
                  <span key={idx} className="bg-white text-neutral-800 text-xs font-semibold px-2.5 py-1 rounded-lg border border-neutral-200 shadow-2xs">
                    {m}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-neutral-400 italic">No additional team members added for this log.</p>
            )}
          </div>

          <div className="mt-auto space-y-4">
            {/* Photo Evidence Section */}
            <div>
              <p className="text-xs font-bold text-neutral-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <ImageIcon size={13} className="text-primary" /> Captured Photo Evidence
              </p>
              {selectedRecord.photoUrl ? (
                <PhotoCard photoUrl={selectedRecord.photoUrl} onEnlarge={(url) => setPreviewPhotoUrl(url)} />
              ) : (
                <div className="aspect-video bg-neutral-100 rounded-xl border border-neutral-200 flex flex-col items-center justify-center text-neutral-400 text-xs gap-1 p-4 text-center">
                  <ImageIcon size={24} className="text-neutral-300" />
                  <span>No photo attached to this record</span>
                </div>
              )}
            </div>
            
            {/* GPS Location Map */}
            <div>
              <p className="text-xs font-bold text-neutral-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <MapPin size={13} className="text-primary" /> Recorded Location Map
              </p>
              <AdminRecordMap
                latitude={selectedRecord.latitude}
                longitude={selectedRecord.longitude}
                siteName={selectedRecord.siteName}
                locationName={selectedRecord.locationName}
                distanceFromSite={selectedRecord.distanceFromSite}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingRecordId && (
        <div className="fixed inset-0 z-[150] bg-transparent flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-md border border-neutral-300 text-center space-y-4">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-neutral-800">Delete Attendance Log?</h3>
              <p className="text-xs text-neutral-500 mt-1">Are you sure you want to permanently delete this record? This action cannot be undone.</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setDeletingRecordId(null)}
                className="flex-1 py-3 rounded-xl font-bold text-xs bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleDelete(deletingRecordId)}
                className="flex-1 py-3 rounded-xl font-bold text-xs bg-red-600 text-white hover:bg-red-700 shadow-md transition-colors"
              >
                Delete Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Photo Modal */}
      {previewPhotoUrl && (
        <div 
          className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setPreviewPhotoUrl(null)}
        >
          <div className="relative max-w-2xl w-full bg-neutral-900 rounded-3xl overflow-hidden p-2 border border-neutral-700 shadow-2xl">
            <img src={previewPhotoUrl} alt="Enlarged photo evidence" className="w-full rounded-2xl max-h-[80vh] object-contain" />
            <p className="text-center text-xs text-neutral-400 mt-2 font-medium py-1">Click anywhere to close</p>
          </div>
        </div>
      )}

    </div>
  );
}
