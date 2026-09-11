import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, Mail, Phone, MapPin, Lock, Eye, EyeOff, Clock, ArrowLeft } from 'lucide-react';
import { OjtService } from '@/services/ojt/ojtService';
import { useAuthStore } from '@/stores/useAuthStore';

export default function OjtRegister() {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [school, setSchool] = useState('');
  const [requiredHours, setRequiredHours] = useState<number>(480);
  const [requiredHoursPerDay, setRequiredHoursPerDay] = useState<number>(8);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !school.trim()) {
      setError('Please fill in all required fields (First Name, Last Name, Email, School)');
      return;
    }

    if (password.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Password and Confirm Password do not match');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check if email is already registered
      const existingStudents = await OjtService.getAllStudents();
      const emailTaken = existingStudents.some(
        (s) => s.email.toLowerCase() === email.trim().toLowerCase()
      );

      if (emailTaken) {
        setError('This email address is already registered. Please use a different email or sign in.');
        setLoading(false);
        return;
      }

      const student = await OjtService.registerStudent({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        name: `${firstName.trim()} ${lastName.trim()}`,
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        school: school.trim(),
        requiredHours: Number(requiredHours) || 480,
        requiredHoursPerDay: Number(requiredHoursPerDay) || 8,
        passwordHash: password.trim(),
      });

      // Auto login student
      login(
        {
          id: student.id,
          name: student.name,
          teamId: 'ojt-team',
          status: 'active',
          role: 'OJT Student',
        } as any,
        'employee'
      );

      navigate('/ojt/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to register OJT Student account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-orange-50 flex flex-col items-center justify-center p-4 sm:p-6">
      {/* Header card */}
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-neutral-200/80 space-y-6">
        <div className="flex items-center justify-between">
          <Link
            to="/login"
            className="flex items-center gap-1 text-xs font-bold text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            <ArrowLeft size={16} /> Back to Login
          </Link>
          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-extrabold border border-primary/20">
            OJT Registration
          </span>
        </div>

        <div className="text-center">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner border border-primary/20">
            <GraduationCap size={32} />
          </div>
          <h1 className="text-2xl font-black text-neutral-900 leading-tight">
            Register OJT Account
          </h1>
          <p className="text-xs text-neutral-500 font-semibold mt-1">
            Create your student portal for tracking daily attendance &amp; OJT hours
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-4 text-xs font-semibold">
          {/* First Name & Last Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-neutral-600 uppercase tracking-wider mb-1">
                First Name *
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-neutral-800 focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-neutral-600 uppercase tracking-wider mb-1">
                Last Name *
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-neutral-800 focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-600 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Mail size={12} className="text-primary" /> Email Address *
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

          {/* Phone & School */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-neutral-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Phone size={12} /> Contact No.
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="09171234567"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-neutral-800 focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-neutral-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                <GraduationCap size={12} /> School *
              </label>
              <input
                type="text"
                required
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                placeholder="School / University"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-neutral-800 focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
          </div>

          {/* Home Address */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-600 uppercase tracking-wider mb-1 flex items-center gap-1">
              <MapPin size={12} /> Home Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Barangay, City, Province"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-neutral-800 focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>

          {/* Required Hours Settings */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
            <div>
              <label className="block text-[10px] font-bold text-neutral-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Clock size={12} className="text-primary" /> Total OJT Hours *
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
                Daily Hours (Default: 8)
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

          {/* Password & Confirm Password */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-neutral-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Lock size={12} className="text-primary" /> Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-neutral-800 focus:ring-2 focus:ring-primary/20 outline-none pr-8 font-bold"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-neutral-600 uppercase tracking-wider mb-1">
                Confirm Password *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-neutral-800 focus:ring-2 focus:ring-primary/20 outline-none pr-8 font-bold"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                >
                  {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <p className="text-xs font-bold text-red-500 text-center py-1">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-primary via-orange-500 to-primary-dark text-white rounded-2xl font-black text-sm shadow-lg hover:shadow-xl transition-all cursor-pointer disabled:opacity-50 active:scale-[0.98]"
          >
            {loading ? 'Creating Account...' : 'Complete Registration & Access Portal'}
          </button>
        </form>

        <p className="text-center text-xs text-neutral-500 font-semibold pt-2">
          Already registered?{' '}
          <Link to="/ojt/login" className="text-primary font-extrabold hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
