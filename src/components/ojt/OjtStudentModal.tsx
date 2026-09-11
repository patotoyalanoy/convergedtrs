import { useState } from 'react';
import { UserPlus, UserCheck, X, Mail, Phone, MapPin, GraduationCap, Lock, Clock, Eye, EyeOff } from 'lucide-react';
import { OjtStudent } from '@/types/ojt';
import { OjtService } from '@/services/ojt/ojtService';

interface Props {
  studentToEdit?: OjtStudent | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function OjtStudentModal({ studentToEdit, onClose, onSaved }: Props) {
  const isEditing = !!studentToEdit;

  const [firstName, setFirstName] = useState(studentToEdit?.firstName || '');
  const [lastName, setLastName] = useState(studentToEdit?.lastName || '');
  const [email, setEmail] = useState(studentToEdit?.email || '');
  const [phone, setPhone] = useState(studentToEdit?.phone || '');
  const [address, setAddress] = useState(studentToEdit?.address || '');
  const [school, setSchool] = useState(studentToEdit?.school || '');
  const [requiredHours, setRequiredHours] = useState<number>(studentToEdit?.requiredHours || 480);
  const [requiredHoursPerDay, setRequiredHoursPerDay] = useState<number>(studentToEdit?.requiredHoursPerDay || 8);
  const [passwordHash, setPasswordHash] = useState(studentToEdit?.passwordHash || '123456');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<'active' | 'completed' | 'inactive'>(studentToEdit?.status || 'active');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !school.trim()) {
      setError('Please fill in all required fields (Name, Email, School)');
      return;
    }

    if (passwordHash.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isEditing && studentToEdit) {
        await OjtService.updateStudent(studentToEdit.id, {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          address: address.trim(),
          school: school.trim(),
          requiredHours: Number(requiredHours) || 480,
          requiredHoursPerDay: Number(requiredHoursPerDay) || 8,
          passwordHash: passwordHash.trim(),
          status,
        });
      } else {
        await OjtService.registerStudent({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          name: `${firstName.trim()} ${lastName.trim()}`,
          email: email.trim(),
          phone: phone.trim(),
          address: address.trim(),
          school: school.trim(),
          requiredHours: Number(requiredHours) || 480,
          requiredHoursPerDay: Number(requiredHoursPerDay) || 8,
          passwordHash: passwordHash.trim(),
        });
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save OJT Student record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            {isEditing ? <UserCheck className="text-primary" size={22} /> : <UserPlus className="text-primary" size={22} />}
            <h3 className="font-extrabold text-lg text-neutral-800">
              {isEditing ? 'Edit OJT Student Record' : 'Register New OJT Student'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-neutral-700">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs font-semibold">
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
                placeholder="e.g. Juan"
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
                placeholder="e.g. Dela Cruz"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-neutral-800 focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Mail size={12} /> Email *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@school.edu.ph"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-neutral-800 focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Phone size={12} /> Phone
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="09171234567"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-neutral-800 focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
          </div>

          {/* School & Address */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              <GraduationCap size={12} /> School / University *
            </label>
            <input
              type="text"
              required
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              placeholder="e.g. Mindanao State University - IIT"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-neutral-800 focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              <MapPin size={12} /> Home / Present Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Barangay, City, Province"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-neutral-800 focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>

          {/* Required Hours Total & Daily */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
            <div>
              <label className="block text-[10px] font-bold text-neutral-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Clock size={12} className="text-primary" /> Total Required OJT Hours *
              </label>
              <input
                type="number"
                min={10}
                max={2000}
                required
                value={requiredHours}
                onChange={(e) => setRequiredHours(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-neutral-800 font-extrabold focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-neutral-600 uppercase tracking-wider mb-1">
                Hours Per Day (Default: 8)
              </label>
              <input
                type="number"
                min={4}
                max={10}
                required
                value={requiredHoursPerDay}
                onChange={(e) => setRequiredHoursPerDay(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-neutral-800 font-extrabold focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
          </div>

          {/* Password & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Lock size={12} className="text-primary" /> Account Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={passwordHash}
                  onChange={(e) => setPasswordHash(e.target.value)}
                  placeholder="Set password"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-neutral-800 font-bold focus:ring-2 focus:ring-primary/20 outline-none pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                Account Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-neutral-800 font-bold focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
              >
                <option value="active">Active OJT</option>
                <option value="completed">Completed</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {error && (
            <p className="text-xs font-bold text-red-500 text-center py-1">
              {error}
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
              {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Register OJT Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
