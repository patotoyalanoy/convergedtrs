import { useState } from 'react';
import { AttendanceType, GeoLocation, VerificationStatus } from '@/types';
import CameraCapture from './CameraCapture';
import LocationVerification from './LocationVerification';
import AttendanceConfirmation from './AttendanceConfirmation';
import { AttendanceService } from '@/services/attendance/attendanceService';
import { useAuthStore } from '@/stores/useAuthStore';
import { CheckCircle2 } from 'lucide-react';

interface Props {
  type: AttendanceType;
  onComplete: () => void;
  onClose: () => void;
}

type Step = 'camera' | 'location' | 'confirm' | 'success';

export default function AttendanceFlow({ type, onComplete, onClose }: Props) {
  const { user } = useAuthStore();
  const [step, setStep] = useState<Step>('camera');
  
  // State to pass between steps
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [status, setStatus] = useState<VerificationStatus | null>(null);

  const [isSaving, setIsSaving] = useState(false);

  // Mock assigned site for demonstration
  const assignedSite = {
    id: 'site-1',
    name: 'Converge Site - Makati Tower',
    latitude: 14.5547,
    longitude: 121.0244,
    geofenceRadius: 100
  };

  const handlePhotoCaptured = (blob: Blob, url: string) => {
    setPhotoBlob(blob);
    setPhotoUrl(url);
    setStep('location');
  };

  const handleLocationVerified = (loc: GeoLocation, dist: number, stat: VerificationStatus) => {
    setLocation(loc);
    setDistance(dist);
    setStatus(stat);
    setStep('confirm');
  };

  const handleConfirmAndSave = async () => {
    if (!user || !photoBlob || !location || distance === null || !status) return;
    
    setIsSaving(true);
    try {
      await AttendanceService.saveLocalAttendance({
        employeeId: user.id,
        teamId: 'team-1', // user.teamId ideally
        siteId: assignedSite.id,
        type,
        recordedAt: new Date().toISOString(),
        location,
        distanceFromSite: distance,
        verificationStatus: status,
        photoFile: photoBlob,
        photoUrl: photoUrl || undefined
      });
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
        siteName={assignedSite.name}
        isSaving={isSaving}
        onConfirm={handleConfirmAndSave}
        onCancel={() => setStep('location')}
      />
    );
  }

  if (step === 'success') {
    return (
      <div className="absolute inset-0 z-50 bg-white flex flex-col items-center justify-center p-6 text-center">
        <CheckCircle2 size={80} className="text-green-500 mb-6" />
        <h2 className="text-2xl font-bold text-neutral-800 mb-2">Time In Recorded!</h2>
        <p className="text-neutral-500 mb-8">Your attendance has been saved and will sync automatically.</p>
        
        <div className="bg-neutral-50 p-6 rounded-2xl w-full max-w-xs mb-8">
          <p className="text-primary font-bold mb-2">{type === 'TIME_IN' ? 'Time In' : 'Time Out'}</p>
          <p className="text-sm text-neutral-500 mb-1">{new Date().toLocaleDateString()}</p>
          <p className="text-3xl font-black text-secondary">
            {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </p>
        </div>
        
        <button 
          onClick={() => {
            onComplete();
            onClose();
          }}
          className="w-full max-w-xs bg-primary text-white font-bold py-4 rounded-xl shadow-sm text-lg active:scale-95 transition-transform"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return null;
}
