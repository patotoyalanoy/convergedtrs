import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAppStore } from '@/stores/useAppStore';
import { format } from 'date-fns';
import { CheckCircle2, MapPin, Clock } from 'lucide-react';
import AttendanceFlow from '@/components/attendance/AttendanceFlow';
import { AttendanceType } from '@/types';

export default function Home() {
  const { user } = useAuthStore();
  const { isOnline } = useAppStore();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeFlow, setActiveFlow] = useState<AttendanceType | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAttendance = (type: AttendanceType) => {
    setActiveFlow(type);
  };

  return (
    <div className="p-4 flex flex-col min-h-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 bg-white p-4 rounded-xl shadow-sm border border-neutral-100">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
          {user?.name?.charAt(0) || 'E'}
        </div>
        <div>
          <h2 className="font-semibold text-neutral-800">Hello, {user?.name || 'Employee'}</h2>
          <p className="text-sm text-neutral-500">Technician • Team Alpha</p>
        </div>
      </div>

      {/* Status Card */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-neutral-100 flex flex-col justify-center">
          <p className="text-sm text-neutral-500 mb-1">Today's Status</p>
          <p className="font-semibold text-orange-600">Not Time In</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-neutral-100 flex flex-col justify-center items-end text-right">
          <p className="text-sm font-semibold text-neutral-800">{format(currentTime, 'MMM dd, yyyy')}</p>
          <p className="text-sm text-neutral-500">{format(currentTime, 'EEEE')}</p>
        </div>
      </div>

      {/* Assigned Site */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-neutral-100 mb-8">
        <p className="text-sm text-neutral-500 mb-2">Assigned Site</p>
        <div className="flex items-start gap-3">
          <MapPin className="text-secondary shrink-0 mt-0.5" size={20} />
          <div>
            <p className="font-semibold text-neutral-800">Converge Site - Makati Tower</p>
            <p className="text-sm text-neutral-500 line-clamp-1">6789 Ayala Ave, Makati City</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-4 mt-auto">
        <button 
          onClick={() => handleAttendance('TIME_IN')}
          className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-xl shadow-md flex items-center justify-center gap-2 text-lg transition-transform active:scale-95"
        >
          <Clock size={24} />
          TIME IN
        </button>
        <button 
          onClick={() => handleAttendance('TIME_OUT')}
          className="w-full bg-white hover:bg-neutral-50 text-primary border-2 border-primary font-bold py-4 rounded-xl shadow-sm flex items-center justify-center gap-2 text-lg transition-transform active:scale-95"
        >
          <CheckCircle2 size={24} />
          TIME OUT
        </button>
      </div>

      {activeFlow && (
        <AttendanceFlow
          type={activeFlow}
          onComplete={() => console.log('Attendance completed')}
          onClose={() => setActiveFlow(null)}
        />
      )}
    </div>
  );
}
