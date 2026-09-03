import { useEffect, useState } from 'react';
import { LocationService } from '@/services/locationService';
import { calculateDistance } from '@/lib/geolocation/haversine';
import { GeoLocation, VerificationStatus } from '@/types';
import { MapPin, Loader2, ArrowLeft, Navigation } from 'lucide-react';
import { clsx } from 'clsx';

interface Props {
  site: { latitude: number; longitude: number; name: string; geofenceRadius: number };
  onVerified: (location: GeoLocation, distance: number, status: VerificationStatus) => void;
  onCancel: () => void;
}

export default function LocationVerification({ site, onVerified, onCancel }: Props) {
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [distance, setDistance] = useState<number | null>(null);
  const [status, setStatus] = useState<VerificationStatus | null>(null);

  useEffect(() => {
    async function fetchLocation() {
      try {
        const coords = await LocationService.getCurrentLocation();
        setLocation(coords);
        
        const dist = calculateDistance(coords.latitude, coords.longitude, site.latitude, site.longitude);
        setDistance(dist);
        
        let verStatus: VerificationStatus = 'Verified On Site';
        if (coords.accuracy > 100) {
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
      onVerified(location, distance, status);
    }
  };

  return (
    <div className="absolute inset-0 z-50 bg-neutral-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-4 py-3 flex items-center">
        <button onClick={onCancel} className="p-2 -ml-2 text-neutral-600">
          <ArrowLeft size={24} />
        </button>
        <h2 className="font-semibold text-lg ml-2">Location Verification</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-neutral-500">
            <Loader2 size={48} className="animate-spin mb-4 text-primary" />
            <p className="font-medium">Acquiring High-Accuracy GPS...</p>
            <p className="text-sm mt-2 text-center px-8">Please wait while we verify your location against the assigned Converge site.</p>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-500 mb-4">
              <Navigation size={32} />
            </div>
            <h3 className="font-bold text-lg mb-2 text-neutral-800">Location Error</h3>
            <p className="text-neutral-600 mb-6 px-4">{error}</p>
            <button onClick={onCancel} className="bg-neutral-200 text-neutral-800 px-6 py-2 rounded-lg font-semibold">Go Back</button>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Map Mockup (In reality, replace with a Map library like Leaflet/Google Maps) */}
            <div className="bg-neutral-200 rounded-xl flex-1 mb-6 relative overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#444 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
              <div className="text-center z-10 flex flex-col items-center">
                <MapPin size={48} className="text-primary mb-2 drop-shadow-md" />
                <span className="bg-white px-3 py-1 rounded-full text-xs font-bold shadow-sm text-neutral-700">Map Interface</span>
              </div>
            </div>

            {/* Results Card */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-4 mb-6">
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-neutral-100">
                <span className="text-sm text-neutral-500">Distance from site</span>
                <span className="font-bold text-lg">{distance} meters</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-500">Status</span>
                <span className={clsx(
                  "font-bold text-sm px-3 py-1 rounded-full",
                  status === 'Verified On Site' ? "bg-green-100 text-green-700" :
                  status === 'Outside Allowed Area' ? "bg-orange-100 text-orange-700" :
                  "bg-red-100 text-red-700"
                )}>
                  {status}
                </span>
              </div>
              {status === 'Outside Allowed Area' && (
                <p className="text-xs text-orange-600 mt-4 leading-relaxed">
                  You are outside the {site.geofenceRadius}m geofence. Your attendance will be flagged for admin review.
                </p>
              )}
            </div>

            <button 
              onClick={handleContinue}
              className="mt-auto w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-xl shadow-md text-lg transition-transform active:scale-95"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
