import { useState, useEffect } from 'react';
import { AttendanceType, GeoLocation, VerificationStatus } from '@/types';
import CameraCapture from './CameraCapture';
import LocationVerification from './LocationVerification';
import AttendanceConfirmation from './AttendanceConfirmation';
import { AttendanceService } from '@/services/attendance/attendanceService';
import { useAuthStore } from '@/stores/useAuthStore';
import { CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export interface SiteItem {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  geofenceRadius: number;
}

interface Props {
  type: AttendanceType;
  initialSite?: SiteItem;
  sitesList?: SiteItem[];
  onComplete: () => void;
  onClose: () => void;
}

type Step = 'camera' | 'location' | 'confirm' | 'success';

const DEFAULT_SITE: SiteItem = {
  id: 'site-1',
  name: 'Converge Field Site',
  latitude: 14.5547,
  longitude: 121.0244,
  geofenceRadius: 100
};

export default function AttendanceFlow({ type, initialSite, sitesList: propSitesList, onComplete, onClose }: Props) {
  const { user } = useAuthStore();
  const [step, setStep] = useState<Step>('camera');
  
  // State to pass between steps
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [status, setStatus] = useState<VerificationStatus | null>(null);

  const [isSaving, setIsSaving] = useState(false);

  // Dynamic assigned site loaded from props or Supabase
  const [assignedSite, setAssignedSite] = useState<SiteItem>(initialSite || DEFAULT_SITE);
  const [sitesList, setSitesList] = useState<SiteItem[]>(propSitesList || (initialSite ? [initialSite] : [DEFAULT_SITE]));
  const [customSiteName, setCustomSiteName] = useState<string>(initialSite?.name || 'Converge Field Site');

  useEffect(() => {
    if (initialSite) {
      setAssignedSite(initialSite);
      setCustomSiteName(initialSite.name);
    }
    if (propSitesList && propSitesList.length > 0) {
      setSitesList(propSitesList);
    }
  }, [initialSite, propSitesList]);

  useEffect(() => {
    if (!initialSite) {
      async function fetchSite() {
        try {
          const { data: sites } = await supabase.from('sites').select('*').order('created_at', { ascending: false });
          if (sites && sites.length > 0) {
            const mapped: SiteItem[] = sites.map(s => ({
              id: s.id,
              name: s.name,
              latitude: s.latitude || 14.5547,
              longitude: s.longitude || 121.0244,
              geofenceRadius: s.geofence_radius || 100
            }));
            setSitesList(mapped);
            setAssignedSite(mapped[0]);
            setCustomSiteName(mapped[0].name);
          }
        } catch (err) {
          console.warn('Using default site configuration:', err);
        }
      }
      fetchSite();
    }
  }, [initialSite]);

  const handlePhotoCaptured = (blob: Blob, _url: string) => {
    setPhotoBlob(blob);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoUrl(reader.result as string);
      setStep('location');
    };
    reader.readAsDataURL(blob);
  };

  const handleLocationVerified = (
    loc: GeoLocation, 
    dist: number, 
    stat: VerificationStatus, 
    locationName?: string
  ) => {
    setLocation(loc);
    setDistance(dist);
    setStatus(stat);
    if (locationName) {
      setCustomSiteName(locationName);
    }
    setStep('confirm');
  };

  const handleConfirmAndSave = async (teamMembers: string[]) => {
    if (!user || !photoBlob || !location || distance === null || !status) return;
    
    setIsSaving(true);
    try {
      await AttendanceService.saveLocalAttendance({
        employeeId: user.id,
        teamId: (user as any)?.teamId || 'team-1',
        siteId: assignedSite.id,
        type,
        recordedAt: new Date().toISOString(),
        location,
        distanceFromSite: distance,
        verificationStatus: status,
        photoFile: photoBlob,
        photoUrl: photoUrl || undefined,
        teamName: (user as any)?.teamName || assignedSite.name || 'Field Team',
        membersPresent: teamMembers,
        locationName: customSiteName || assignedSite.name
      });
      console.log(`Saved attendance for site: ${customSiteName} with members:`, teamMembers);
      setStep('success');
    } catch (err) {
      console.error(err);
      alert('Failed to save attendance locally.');
    } finally {
      setIsSaving(false);
    }
  };

  if (step === 'camera') {
    return <CameraCapture onCapture={handlePhotoCaptured} onCancel={onClose} />;
  }

  if (step === 'location') {
    return (
      <LocationVerification 
        type={type}
        site={assignedSite}
        onVerified={handleLocationVerified} 
        onCancel={() => setStep('camera')} 
      />
    );
  }

  if (step === 'confirm' && photoUrl && location && distance !== null && status) {
    return (
      <AttendanceConfirmation
        type={type}
        photoUrl={photoUrl}
        location={location}
        distance={distance}
        status={status}
        siteName={customSiteName || assignedSite.name}
        isSaving={isSaving}
        onConfirm={handleConfirmAndSave}
        onCancel={() => setStep('location')}
      />
    );
  }

  if (step === 'success') {
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const isTimeIn = type === 'TIME_IN';

    return (
      <div className="absolute inset-0 z-50 bg-gradient-to-b from-green-50 via-white to-orange-50 flex flex-col items-center justify-center p-6 text-center overflow-hidden">
        {/* Decorative background circles */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-green-100 rounded-full opacity-40 blur-2xl" />
        <div className="absolute bottom-20 right-8 w-40 h-40 bg-orange-100 rounded-full opacity-40 blur-2xl" />
        <div className="absolute top-1/3 right-12 w-20 h-20 bg-blue-100 rounded-full opacity-30 blur-xl" />

        {/* Animated success icon with ring */}
        <div className="relative mb-5">
          <div className="absolute inset-0 w-24 h-24 rounded-full bg-green-100 animate-ping opacity-30" />
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-200">
            <CheckCircle2 size={48} className="text-white" strokeWidth={2.5} />
          </div>
        </div>

        {/* Title & subtitle */}
        <h2 className="text-2xl font-extrabold text-neutral-800 mb-1 tracking-tight">
          {isTimeIn ? '🎉 Clocked In!' : '👋 Clocked Out!'}
        </h2>
        <p className="text-neutral-500 text-sm mb-6 max-w-xs leading-relaxed">
          Your attendance has been successfully recorded and saved.
        </p>

        {/* Info card */}
        <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl w-full max-w-xs mb-4 border border-neutral-100 shadow-md space-y-4">
          {/* Type badge */}
          <div className="flex items-center justify-center">
            <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
              isTimeIn
                ? 'bg-green-100 text-green-700'
                : 'bg-orange-100 text-orange-700'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isTimeIn ? 'bg-green-500' : 'bg-orange-500'}`} />
              {isTimeIn ? 'Time In' : 'Time Out'}
            </span>
          </div>

          {/* Time display */}
          <div>
            <p className="text-4xl font-black text-neutral-800 tracking-tight">
              {formattedTime}
            </p>
            <p className="text-xs text-neutral-400 mt-1">{formattedDate}</p>
          </div>

          {/* Divider */}
          <div className="border-t border-dashed border-neutral-200" />

          {/* Site info */}
          <div className="flex items-center justify-center gap-2 text-sm text-neutral-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span className="font-semibold">{customSiteName}</span>
          </div>
        </div>

        {/* Subtle note */}
        <p className="text-[11px] text-neutral-400 mb-6 max-w-[260px] leading-snug">
          Photo, GPS coordinates, and team list have been saved. Data will sync automatically when online.
        </p>

        {/* Back to Home button */}
        <button
          onClick={() => {
            onComplete();
            onClose();
          }}
          className="w-full max-w-xs bg-gradient-to-r from-primary to-primary-dark text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 text-base active:scale-[0.97] transition-all duration-150 hover:shadow-xl"
        >
          ← Back to Home
        </button>
      </div>
    );
  }

  return null;
}
