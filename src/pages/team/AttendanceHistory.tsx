import { useEffect, useState, useRef } from 'react';
import { Calendar, Clock, MapPin, Search, CheckCircle2, ShieldAlert, Image, Navigation2 } from 'lucide-react';
import { clsx } from 'clsx';
import { fetchAllAttendanceRecords } from '@/services/attendanceApi';
import { useAuthStore } from '@/stores/useAuthStore';
import { FormattedAttendanceRecord } from '@/utils/exportUtils';

// ─── Tiny inline Leaflet map for each attendance record ───────────────────────
interface AttendanceMapProps {
  latitude: number;
  longitude: number;
  label?: string;
}

function AttendanceMap({ latitude, longitude, label }: AttendanceMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Dynamically import Leaflet to avoid SSR issues
    import('leaflet').then((L) => {
      import('leaflet/dist/leaflet.css');

      // Fix default marker icon paths broken by bundlers
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (!mapRef.current || mapInstanceRef.current) return;

      const map = L.map(mapRef.current, {
        center: [latitude, longitude],
        zoom: 15,
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        touchZoom: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      L.marker([latitude, longitude])
        .addTo(map)
        .bindPopup(label || 'Recorded Location')
        .openPopup();

      mapInstanceRef.current = map;
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [latitude, longitude, label]);

  return (
    <div className="mt-3 rounded-xl overflow-hidden border border-neutral-200 shadow-xs">
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-50 border-b border-neutral-200">
        <Navigation2 size={12} className="text-primary" />
        <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider">
          GPS Location
        </span>
        <span className="ml-auto text-[9px] font-mono text-neutral-400">
          {latitude.toFixed(5)}, {longitude.toFixed(5)}
        </span>
      </div>
      <div ref={mapRef} style={{ height: 160, width: '100%' }} />
    </div>
  );
}

// ─── Main Attendance History Page ─────────────────────────────────────────────
export default function AttendanceHistory() {
  const { user } = useAuthStore();
  const [records, setRecords] = useState<FormattedAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function loadRecords() {
      setLoading(true);
      try {
        const allRecords = await fetchAllAttendanceRecords();
        if (user) {
          const userRecords = allRecords.filter(
            (r) => r.employeeId === user.id || r.employeeName.toLowerCase() === user.name.toLowerCase()
          );
          setRecords(userRecords.length > 0 ? userRecords : allRecords);
        } else {
          setRecords(allRecords);
        }
      } catch (err) {
        console.error('Failed to load user attendance history:', err);
      } finally {
        setLoading(false);
      }
    }
    loadRecords();
  }, [user]);

  const filtered = records.filter((r) => {
    const siteText = (r.siteName || '').toLowerCase();
    const typeText = (r.type || '').toLowerCase();
    const dateText = (r.formattedDate || '').toLowerCase();
    const searchLower = search.toLowerCase();
    return siteText.includes(searchLower) || typeText.includes(searchLower) || dateText.includes(searchLower);
  });

  return (
    <div className="flex flex-col flex-1 bg-slate-50 min-h-full pb-10">
      {/* Header */}
      <div className="bg-white px-5 pt-6 pb-4 shadow-xs z-10 sticky top-0 border-b border-neutral-200/80">
        <h1 className="text-xl font-extrabold text-neutral-800">My Attendance Logs</h1>
        <p className="text-xs text-neutral-500 mt-0.5 font-medium">History of your Time In & Time Out records</p>

        <div className="mt-4 relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search date, type, or site name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-neutral-100/80 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 border border-neutral-200"
          />
        </div>
      </div>

      {/* List */}
      <div className="p-4 space-y-3 flex-1">
        {loading ? (
          <div className="text-center py-12 text-neutral-400 text-sm font-medium">
            Fetching your attendance history...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-neutral-400 text-sm font-medium">
            No attendance records found{search ? ` matching "${search}"` : ''}.
          </div>
        ) : (
          filtered.map((record) => {
            const isExpanded = expandedId === record.id;
            const hasPhoto = !!record.photoUrl;
            const hasMap = !!(record.latitude && record.longitude);

            return (
              <div
                key={record.id}
                className="bg-white rounded-2xl shadow-sm border border-neutral-200/70 hover:border-neutral-300 transition-all overflow-hidden"
              >
                {/* Card Header — always visible */}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-col">
                      <span className={clsx(
                        'text-xs font-black px-2.5 py-1 rounded-md uppercase tracking-wider self-start mb-1',
                        record.type === 'TIME_IN' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                      )}>
                        {record.type === 'TIME_IN' ? 'Time In' : 'Time Out'}
                      </span>
                      <span className="text-xs font-bold text-neutral-600 mt-1 flex items-center gap-1">
                        <Calendar size={13} className="text-neutral-400" /> {record.formattedDate}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1.5 bg-neutral-50 px-3 py-1 rounded-xl border border-neutral-200/80 shadow-2xs">
                        <Clock size={14} className="text-primary" />
                        <span className="font-extrabold text-neutral-900 text-sm">{record.formattedTime}</span>
                      </div>
                      <span className={clsx(
                        'text-[10px] font-bold uppercase tracking-wider',
                        record.syncStatus === 'Synced' ? 'text-emerald-600' : 'text-amber-600'
                      )}>
                        {record.syncStatus}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-neutral-100">
                    <div className="flex items-center gap-2 text-xs font-semibold text-neutral-700">
                      <MapPin size={14} className="text-primary shrink-0" />
                      <span>{record.siteName}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className={clsx(
                        'text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wider',
                        (record.verificationStatus || '').includes('Verified')
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-orange-50 text-orange-700 border border-orange-200'
                      )}>
                        {(record.verificationStatus || '').includes('Verified')
                          ? <CheckCircle2 size={12} />
                          : <ShieldAlert size={12} />}
                        {record.verificationStatus}
                      </span>

                      {record.createdOffline && (
                        <span className="text-[10px] bg-neutral-100 text-neutral-500 font-bold px-2 py-0.5 rounded">
                          Offline Mode
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expand toggle — only if there's a photo or map */}
                  {(hasPhoto || hasMap) && (
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : record.id)}
                      className={clsx(
                        "mt-3 w-full flex items-center justify-center gap-2 text-[11px] font-bold py-2.5 rounded-xl transition-all duration-200 active:scale-[0.97] cursor-pointer",
                        isExpanded
                          ? "text-white bg-primary shadow-md shadow-primary/20"
                          : "text-primary bg-primary/5 hover:bg-primary/10 border border-primary/10"
                      )}
                    >
                      {hasPhoto && <Image size={13} />}
                      {hasMap && <Navigation2 size={13} />}
                      {isExpanded ? '✕ Hide Details' : '📎 Show Photo & Location'}
                    </button>
                  )}
                </div>

                {/* Expandable: Photo + Map */}
                {isExpanded && (hasPhoto || hasMap) && (
                  <div className="px-4 pb-4 border-t border-neutral-100 pt-3 space-y-3">
                    {/* Photo */}
                    {hasPhoto && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <Image size={12} className="text-neutral-500" />
                          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                            Attendance Photo
                          </span>
                        </div>
                        <img
                          src={record.photoUrl!}
                          alt="Attendance selfie"
                          className="w-full rounded-xl object-cover border border-neutral-200 max-h-52"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                    )}

                    {/* Map */}
                    {hasMap && (
                      <AttendanceMap
                        latitude={record.latitude!}
                        longitude={record.longitude!}
                        label={record.siteName || record.locationName}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
