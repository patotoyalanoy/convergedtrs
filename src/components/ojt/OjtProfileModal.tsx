import { useState } from 'react';
import { User, Lock, Mail, Phone, MapPin, GraduationCap, X, Eye, EyeOff } from 'lucide-react';
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
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
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

    if (newPassword && newPassword.length < 4) {
      setMessage('New password must be at least 4 characters');
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

      if (newPassword.trim()) {
        updates.passwordHash = newPassword.trim();
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
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-700 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <User className="text-orange-400" size={22} />
            <h3 className="font-extrabold text-lg text-white">My Student Profile</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-3.5 text-xs font-semibold">
          {/* Email (Read only) */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Mail size={13} /> Account Email
            </label>
            <input
              type="text"
              disabled
              value={student.email}
              className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-slate-500 font-bold cursor-not-allowed"
            />
          </div>

          {/* First Name & Last Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                First Name *
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-primary/40 outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Last Name *
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-primary/40 outline-none"
              />
            </div>
          </div>

          {/* School / University */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <GraduationCap size={13} /> School / University
            </label>
            <input
              type="text"
              required
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-primary/40 outline-none"
            />
          </div>

          {/* Phone & Address */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Phone size={13} /> Contact Number
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-primary/40 outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <MapPin size={13} /> Home Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-primary/40 outline-none"
            />
          </div>

          {/* Password Change */}
          <div className="pt-2 border-t border-slate-700">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Lock size={13} className="text-orange-400" /> Update Password (Optional)
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Leave blank to keep current password"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-600 font-bold focus:ring-2 focus:ring-primary/40 outline-none pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {message && (
            <p className={`text-xs font-extrabold text-center py-2 px-3 rounded-xl border ${isSuccess ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20'}`}>
              {message}
            </p>
          )}

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-bold text-xs bg-slate-700 text-slate-200 hover:bg-slate-600 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-primary to-amber-500 text-white hover:shadow-lg shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
