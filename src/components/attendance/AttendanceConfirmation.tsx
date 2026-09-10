import { useState } from 'react';
import { AttendanceType, GeoLocation, VerificationStatus } from '@/types';
import { format } from 'date-fns';
import { ArrowLeft, CheckCircle, UserPlus, Trash2, Users } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from '@/stores/useAuthStore';

interface Props {
  type: AttendanceType;
  photoUrl: string;
  location: GeoLocation;
  distance: number;
  status: VerificationStatus;
  siteName: string;
  onConfirm: (teamMembers: string[]) => void;
  onCancel: () => void;
  isSaving: boolean;
}

export default function AttendanceConfirmation({ 
  type, 
  photoUrl, 
  location, 
  distance, 
  status, 
  siteName, 
  onConfirm, 
  onCancel, 
  isSaving 
}: Props) {
  const { user } = useAuthStore();

  // Dynamic state for adding team members on site with user
  const [teamMembers, setTeamMembers] = useState<string[]>([]);
  const [newMemberName, setNewMemberName] = useState('');

  const handleAddMember = () => {
    const trimmed = newMemberName.trim();
    if (trimmed && !teamMembers.includes(trimmed)) {
      setTeamMembers([...teamMembers, trimmed]);
      setNewMemberName('');
    }
  };

  const handleRemoveMember = (indexToRemove: number) => {
    setTeamMembers(teamMembers.filter((_, idx) => idx !== indexToRemove));
  };

  const handleKeyDownAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddMember();
    }
  };

  const handleFinalConfirm = () => {
    let finalMembers = [...teamMembers];
    if (newMemberName.trim() && !finalMembers.includes(newMemberName.trim())) {
      finalMembers.push(newMemberName.trim());
    }
    onConfirm(finalMembers);
  };

  return (
    <div className="fixed inset-0 z-[100] max-w-lg mx-auto bg-white flex flex-col shadow-2xl">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center">
          {!isSaving && (
            <button onClick={onCancel} className="p-2 -ml-2 text-neutral-600 hover:text-neutral-900">
              <ArrowLeft size={24} />
            </button>
          )}
          <h2 className="font-semibold text-lg ml-2 text-neutral-800">Review & Confirm Attendance</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col space-y-4 pb-28">
        {/* Captured Image Photo Section */}
        <div className="bg-white p-3.5 rounded-xl border border-neutral-200 shadow-sm flex flex-col items-center shrink-0">
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 self-start">Captured Photo Evidence</p>
          <img src={photoUrl} alt="Captured Attendance Photo" className="w-full h-44 object-cover rounded-lg border border-neutral-200 shadow-xs mb-2.5" />
          <div className="w-full flex items-center justify-between text-xs text-neutral-600 px-1">
            <span className="font-semibold text-neutral-800">{user?.name || 'Technician'}</span>
            <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold text-[11px]">Photo Verified</span>
          </div>
        </div>

        {/* 🏷️ Dynamic Team Member Label & Addition Section */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 shrink-0">
          <div className="flex items-center gap-2 mb-1.5">
            <Users size={17} className="text-primary" />
            <h3 className="font-bold text-xs text-neutral-800 uppercase tracking-wider">Team Members On Site With You</h3>
          </div>
          <p className="text-xs text-neutral-500 mb-3">
            Add all team members currently present on site with you during this {type === 'TIME_IN' ? 'Time In' : 'Time Out'}.
          </p>

          {/* Input to add a new member */}
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              onKeyDown={handleKeyDownAdd}
              placeholder="Enter team member name..."
              disabled={isSaving}
              className="flex-1 px-3 py-2 text-sm rounded-lg border border-neutral-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            />
            <button
              onClick={handleAddMember}
              disabled={!newMemberName.trim() || isSaving}
              className="bg-primary hover:bg-primary-dark text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <UserPlus size={14} /> Add Member
            </button>
          </div>

          {/* List of Added Members */}
          {teamMembers.length > 0 ? (
            <div className="space-y-2 mt-2 pt-2 border-t border-neutral-100">
              <p className="text-xs font-semibold text-neutral-600">On-Site Members ({teamMembers.length}):</p>
              <div className="flex flex-wrap gap-2">
                {teamMembers.map((member, index) => (
                  <div key={index} className="bg-neutral-100 border border-neutral-200 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-medium text-neutral-800">
                    <span>{member}</span>
                    <button
                      onClick={() => handleRemoveMember(index)}
                      disabled={isSaving}
                      className="text-neutral-400 hover:text-red-500 transition-colors"
                      title="Remove member"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs italic text-neutral-400">No additional team members added yet. Type a name above to add.</p>
          )}
        </div>

        {/* Details Card */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 space-y-2.5 text-xs shrink-0">
          <div className="flex justify-between items-center pb-2 border-b border-neutral-100">
            <span className="font-semibold text-neutral-500 uppercase">Attendance Type</span>
            <span className={clsx("font-extrabold text-xs px-2.5 py-0.5 rounded-md", type === 'TIME_IN' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700')}>
              {type === 'TIME_IN' ? 'TIME IN' : 'TIME OUT'}
            </span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-neutral-100">
            <span className="font-semibold text-neutral-500 uppercase">Date & Time</span>
            <span className="font-semibold text-neutral-800">{format(new Date(), 'MMM dd, yyyy hh:mm a')}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-neutral-100">
            <span className="font-semibold text-neutral-500 uppercase">Site Location</span>
            <span className="font-semibold text-neutral-800 text-right w-1/2 line-clamp-1">{siteName}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-neutral-100">
            <span className="font-semibold text-neutral-500 uppercase">GPS Coordinates</span>
            <span className="font-mono text-xs text-neutral-700 font-bold">{location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-neutral-100">
            <span className="font-semibold text-neutral-500 uppercase">Distance from site</span>
            <span className="font-bold text-neutral-800">{distance} meters</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold text-neutral-500 uppercase">Geofence Status</span>
            <span className={clsx(
              "font-bold text-xs px-2.5 py-0.5 rounded-full",
              status === 'Verified On Site' ? "bg-green-100 text-green-700" :
              status === 'Outside Allowed Area' ? "bg-orange-100 text-orange-700" :
              "bg-red-100 text-red-700"
            )}>
              {status}
            </span>
          </div>
        </div>

        {/* 🚀 Submit Button Container ALWAYS VISIBLE ABOVE BOTTOM NAV */}
        <div className="pt-2 pb-6 shrink-0">
          <button 
            onClick={handleFinalConfirm}
            disabled={isSaving}
            className={clsx(
              "w-full text-white font-black py-4 px-4 rounded-2xl shadow-xl text-base flex justify-center items-center gap-2 transition-all active:scale-[0.97] disabled:opacity-70 cursor-pointer",
              type === 'TIME_IN'
                ? "bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/25"
                : "bg-gradient-to-r from-orange-500 via-orange-600 to-rose-600 hover:from-orange-600 hover:to-rose-700 shadow-orange-500/25"
            )}
          >
            {isSaving ? (
              <span className="animate-pulse">Saving Attendance...</span>
            ) : (
              <>
                <CheckCircle size={22} />
                CONFIRM & SUBMIT {type === 'TIME_IN' ? 'TIME IN' : 'TIME OUT'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
