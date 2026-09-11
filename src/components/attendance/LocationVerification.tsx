import { useEffect, useState } from 'react';
import { LocationService } from '@/services/locationService';
import { calculateDistance } from '@/lib/geolocation/haversine';
import { AttendanceType, GeoLocation, VerificationStatus } from '@/types';
import { Loader2, ArrowLeft, Navigation, CheckCircle2, Edit3 } from 'lucide-react';
import { clsx } from 'clsx';
import LeafletMap from '../maps/LeafletMap';

interface Props {
  type?: AttendanceType;
  site: { latitude: number; longitude: number; name: string; geofenceRadius: number };
  onVerified: (location: GeoLocation, distance: number, status: VerificationStatus, customLocationName?: string) => void;
  onCancel: () => void;
}

export default function LocationVerification({ type, site, onVerified, onCancel }: Props) {
  const isTimeIn = type === 'TIME_IN';

  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [distance, setDistance] = useState<number | null>(null);
  const [status, setStatus] = useState<VerificationStatus | null>(null);

  // Editable Location Name state above the map
  const [customLocationName, setCustomLocationName] = useState(site.name || 'Current Field Location');

  useEffect(() => {
    async function fetchLocation() {
      try {
        const coords = await LocationService.getCurrentLocation();
        setLocation(coords);
        
        const dist = calculateDistance(coords.latitude, coords.longitude, site.latitude, site.longitude);
        setDistance(dist);
        
        let verStatus: VerificationStatus = 'Verified On Site';
        if (dist > site.geofenceRadius && coords.accuracy > 5000) {
          verStatus = 'GPS Accuracy Too Low';
        } else if (dist > site.geofenceRadius) {
          verStatus = 'Outside Allowed Area';
        }
        
        setStatus(verStatus);
      } catch (err: any) {
        setError(err.message || 'Failed to retrieve location');
        setStatus('Location Unavailable');
      } finally {
        setLoading(false);
      }
    }
    fetchLocation();
  }, [site]);

  const handleContinue = () => {
    if (location && distance !== null && status) {
      onVerified(location, distance, status, customLocationName.trim() || site.name);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] max-w-lg mx-auto bg-white flex flex-col shadow-2xl">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center">
          <button onClick={onCancel} className="p-2 -ml-2 text-neutral-600 hover:text-neutral-900">
            <ArrowLeft size={24} />
          </button>
          <h2 className="font-semibold text-lg ml-2 text-neutral-800">Location Verification</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col space-y-4 pb-8">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-neutral-500 min-h-[300px]">
            <Loader2 size={48} className="animate-spin mb-4 text-primary" />
            <p className="font-bold text-neutral-800">Acquiring GPS Coordinates...</p>
            <p className="text-xs mt-2 text-center text-neutral-500 px-8">Fetching latitude and longitude via Leaflet Maps.</p>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center min-h-[300px]">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-500 mb-4">
              <Navigation size={32} />
            </div>
            <h3 className="font-bold text-lg mb-2 text-neutral-800">Location Access Required</h3>
            <p className="text-neutral-600 mb-6 px-4 text-sm">{error}</p>
            <button onClick={onCancel} className="bg-neutral-200 text-neutral-800 px-6 py-2.5 rounded-xl font-semibold text-sm">Go Back</button>
          </div>
        ) : (
          <div className="flex flex-col flex-1 space-y-4">

            {/* TOP OF THE MAP: Location Name Input */}
            <div className="bg-white rounded-xl p-3 border border-neutral-200 shadow-sm shrink-0">
              <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Edit3 size={13} className="text-primary" />
                Location / Site Name
              </label>
              <input
                type="text"
                value={customLocationName}
                onChange={(e) => setCustomLocationName(e.target.value)}
                placeholder="Enter or customize your location name..."
                className="w-full px-3 py-2 text-sm font-semibold text-neutral-800 bg-neutral-50 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            {/* Interactive Leaflet Map */}
            <div className="h-56 relative rounded-xl overflow-hidden shadow-sm shrink-0">
              {location && (
                <LeafletMap 
                  userLocation={location} 
                  siteLocation={{ ...site, name: customLocationName || site.name }} 
                />
              )}
            </div>

            {/* Coordinates & Proximity Info Card */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 space-y-2.5 text-xs shrink-0">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <span className="font-semibold text-neutral-500 uppercase">Selected Location</span>
                <span className="font-bold text-sm text-neutral-800">{customLocationName || site.name}</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <span className="font-semibold text-neutral-500 uppercase">GPS Coordinates</span>
                <div className="text-right font-mono text-xs text-neutral-800 font-bold">
                  <div>Lat: {location?.latitude.toFixed(6)}</div>
                  <div>Lng: {location?.longitude.toFixed(6)}</div>
                </div>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <span className="font-semibold text-neutral-500 uppercase">Distance to Site</span>
                <span className="font-black text-sm text-neutral-900">{distance} meters</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-semibold text-neutral-500 uppercase">Geofence Status</span>
                <span className={clsx(
                  "font-bold text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1",
                  status === 'Verified On Site' ? "bg-green-100 text-green-700" :
                  status === 'Outside Allowed Area' ? "bg-orange-100 text-orange-700" :
                  "bg-red-100 text-red-700"
                )}>
                  {status === 'Verified On Site' && <CheckCircle2 size={12} />}
                  {status}
                </span>
              </div>
            </div>

            {/* Confirm Button fully visible and easy to press */}
            <div className="pt-2 pb-6 mt-auto shrink-0">
              <button 
                onClick={handleContinue}
                className={clsx(
                  "w-full text-white font-bold py-4 px-4 rounded-2xl shadow-lg text-base transition-all active:scale-[0.97] flex items-center justify-center gap-2 cursor-pointer",
                  isTimeIn 
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/20"
                    : "bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700 shadow-orange-500/20"
                )}
              >
                Confirm Location & Continue
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
