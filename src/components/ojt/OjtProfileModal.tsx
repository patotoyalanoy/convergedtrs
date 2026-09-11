import { useState } from 'react';
import { User, Lock, Mail, Phone, MapPin, GraduationCap, X, CheckCircle2, ShieldCheck } from 'lucide-react';
import { OjtStudent } from '@/types/ojt';
import { OjtService } from '@/services/ojt/ojtService';

interface Props {
  student: OjtStudent;
  onClose: () => void;
  onProfileUpdated: () => void;
}

export default function OjtProfileModal({ student, onClose, onProfileUpdated }: Props) {
  const [firstName, setFirstName] = useState(student.firstName);
  const [lastName, setLastName] = useState(student.lastName);
  const [phone, setPhone] = useState(student.phone);
  const [address, setAddress] = useState(student.address);
  const [school, setSchool] = useState(student.school);
  const [newPin, setNewPin] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setMessage('First Name and Last Name are required');
      setIsSuccess(false);
      return;
    }

    if (newPin && newPin.length !== 4) {
      setMessage('New PIN must be exactly 4 digits');
      setIsSuccess(false);
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const updates: Partial<OjtStudent> = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        school: school.trim(),
      };

      if (newPin.trim()) {
        updates.pinHash = newPin.trim();
      }

      await OjtService.updateStudent(student.id, updates);
      setMessage('Profile updated successfully!');
      setIsSuccess(true);
      onProfileUpdated();

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setMessage(err.message || 'Failed to update profile');
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-neutral-200 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <User className="text-primary" size={22} />
            <h3 className="font-extrabold text-lg text-neutral-800">My Student Profile</h3>
          </div>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-neutral-700">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-3.5 text-xs font-semibold">
          {/* Email (Read only) */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Mail size={13} /> Account Email
            </label>
            <input
              type="text"
              disabled
              value={student.email}
              className="w-full px-3.5 py-2.5 bg-neutral-100 border border-neutral-200 rounded-xl text-neutral-600 font-bold cursor-not-allowed"
            />
          </div>

          {/* First Name & Last Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                First Name *
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-neutral-800 focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                Last Name *
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-neutral-800 focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
          </div>

          {/* School / University */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              <GraduationCap size={13} /> School / University
            </label>
            <input
              type="text"
              required
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-neutral-800 focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>

          {/* Phone & Address */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Phone size={13} /> Contact Number
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-neutral-800 focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              <MapPin size={13} /> Home Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-neutral-800 focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>

          {/* Security PIN Change */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Lock size={13} className="text-primary" /> Update 4-Digit Security PIN (Optional)
            </label>
            <input
              type="password"
              maxLength={4}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
              placeholder="Leave blank to keep current PIN"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-neutral-800 tracking-widest font-black focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>

          {message && (
            <p className={`text-xs font-extrabold text-center py-1 ${isSuccess ? 'text-emerald-600' : 'text-red-500'}`}>
              {message}
            </p>
          )}

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-bold text-xs bg-slate-100 text-neutral-700 hover:bg-slate-200 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-primary to-primary-dark text-white hover:shadow-lg shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
