import { AttendanceType, GeoLocation, VerificationStatus } from '@/types';
import { format } from 'date-fns';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from '@/stores/useAuthStore';

interface Props {
  type: AttendanceType;
  photoUrl: string;
  location: GeoLocation;
  distance: number;
  status: VerificationStatus;
  siteName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isSaving: boolean;
}

export default function AttendanceConfirmation({ type, photoUrl, location, distance, status, siteName, onConfirm, onCancel, isSaving }: Props) {
  const { user } = useAuthStore();
  
  return (
    <div className="absolute inset-0 z-50 bg-neutral-50 flex flex-col">
      <div className="bg-white border-b border-neutral-200 px-4 py-3 flex items-center">
        {!isSaving && (
          <button onClick={onCancel} className="p-2 -ml-2 text-neutral-600">
            <ArrowLeft size={24} />
          </button>
        )}
        <h2 className="font-semibold text-lg ml-2">Review & Confirm</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col">
        {/* Profile Snapshot */}
        <div className="flex items-center gap-4 mb-6 bg-white p-4 rounded-xl border border-neutral-100 shadow-sm">
          <img src={photoUrl} alt="Captured" className="w-16 h-16 rounded-lg object-cover" />
          <div>
            <h3 className="font-bold text-neutral-800">{user?.name}</h3>
            <p className="text-sm text-neutral-500">Technician • Team Alpha</p>
          </div>
        </div>

        {/* Details Card */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-4 mb-6 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-neutral-50">
            <span className="text-sm text-neutral-500">Attendance Type</span>
            <span className={clsx("font-bold text-sm", type === 'TIME_IN' ? 'text-primary' : 'text-neutral-700')}>
              {type === 'TIME_IN' ? 'TIME IN' : 'TIME OUT'}
            </span>
          </div>
          <div className="flex justify-between items-center pb-3 border-b border-neutral-50">
            <span className="text-sm text-neutral-500">Date & Time</span>
            <span className="font-semibold text-sm text-neutral-800">{format(new Date(), 'MMM dd, yyyy hh:mm a')}</span>
          </div>
          <div className="flex justify-between items-center pb-3 border-b border-neutral-50">
            <span className="text-sm text-neutral-500">Site</span>
            <span className="font-semibold text-sm text-neutral-800 text-right w-1/2 line-clamp-1">{siteName}</span>
          </div>
          <div className="flex justify-between items-center pb-3 border-b border-neutral-50">
            <span className="text-sm text-neutral-500">Coordinates</span>
            <span className="font-mono text-xs text-neutral-600">{location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}</span>
          </div>
          <div className="flex justify-between items-center pb-3 border-b border-neutral-50">
            <span className="text-sm text-neutral-500">Distance from site</span>
            <span className="font-semibold text-sm text-neutral-800">{distance} meters</span>
          </div>
          <div className="flex justify-between items-center pb-3 border-b border-neutral-50">
            <span className="text-sm text-neutral-500">Accuracy</span>
            <span className="font-semibold text-sm text-neutral-800">{Math.round(location.accuracy)} meters</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-neutral-500">Status</span>
            <span className={clsx(
              "font-bold text-xs px-2 py-1 rounded-md",
              status === 'Verified On Site' ? "bg-green-50 text-green-700" :
              status === 'Outside Allowed Area' ? "bg-orange-50 text-orange-700" :
              "bg-red-50 text-red-700"
            )}>
              {status}
            </span>
          </div>
        </div>

        <button 
          onClick={onConfirm}
          disabled={isSaving}
          className="mt-auto w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-xl shadow-md text-lg flex justify-center items-center gap-2 transition-transform active:scale-95 disabled:opacity-70 disabled:active:scale-100"
        >
          {isSaving ? (
            <span className="animate-pulse">Saving Record...</span>
          ) : (
            <>
              <CheckCircle size={24} />
              CONFIRM & SAVE
            </>
          )}
        </button>
      </div>
    </div>
  );
}
