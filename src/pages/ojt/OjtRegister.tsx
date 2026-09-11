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
      setError('Please fill in required fields (Name, Email, School)');
      return;
    }

    if (password.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
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
        setError('This email address is already registered.');
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
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-2 sm:p-4">
      {/* Compact Card Fits on Mobile Screens without Scroll */}
      <div className="w-full max-w-sm bg-white rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3">
        <div className="flex items-center justify-between">
          <Link
            to="/ojt/login"
            className="flex items-center gap-1 text-[11px] font-extrabold text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            <ArrowLeft size={14} /> Back to Sign In
          </Link>
          <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-[10px] font-black border border-primary/20">
            Registration
          </span>
        </div>

        <div className="text-center">
          <div className="w-10 h-10 bg-gradient-to-tr from-primary to-orange-400 text-white rounded-xl flex items-center justify-center mx-auto mb-1 shadow-md">
            <GraduationCap size={22} />
          </div>
          <h1 className="text-lg font-black text-neutral-900 leading-tight">
            Register OJT Account
          </h1>
          <p className="text-[10px] text-neutral-500 font-semibold mt-0.5">
            Fill in your details to create your OJT portal
          </p>
        </div>

        {error && (
          <p className="text-[11px] font-extrabold text-red-600 bg-red-50 py-1.5 px-2.5 rounded-lg border border-red-200 text-center">
            {error}
          </p>
        )}

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-2 text-[11px] font-semibold">
          {/* First Name & Last Name */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[9px] font-extrabold text-neutral-500 uppercase tracking-wider mb-0.5">
                First Name *
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-neutral-800 focus:ring-2 focus:ring-primary/20 outline-none text-xs"
              />
            </div>
            <div>
              <label className="block text-[9px] font-extrabold text-neutral-500 uppercase tracking-wider mb-0.5">
                Last Name *
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-neutral-800 focus:ring-2 focus:ring-primary/20 outline-none text-xs"
              />
            </div>
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[9px] font-extrabold text-neutral-500 uppercase tracking-wider mb-0.5 flex items-center gap-0.5">
                <Mail size={10} className="text-primary" /> Email *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@school.edu"
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-neutral-800 focus:ring-2 focus:ring-primary/20 outline-none text-xs"
              />
            </div>
            <div>
              <label className="block text-[9px] font-extrabold text-neutral-500 uppercase tracking-wider mb-0.5 flex items-center gap-0.5">
                <Phone size={10} /> Contact No.
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="09171234567"
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-neutral-800 focus:ring-2 focus:ring-primary/20 outline-none text-xs"
              />
            </div>
          </div>

          {/* School & Address */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[9px] font-extrabold text-neutral-500 uppercase tracking-wider mb-0.5 flex items-center gap-0.5">
                <GraduationCap size={10} /> School *
              </label>
              <input
                type="text"
                required
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                placeholder="University"
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-neutral-800 focus:ring-2 focus:ring-primary/20 outline-none text-xs"
              />
            </div>
            <div>
              <label className="block text-[9px] font-extrabold text-neutral-500 uppercase tracking-wider mb-0.5 flex items-center gap-0.5">
                <MapPin size={10} /> Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="City, Province"
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-neutral-800 focus:ring-2 focus:ring-primary/20 outline-none text-xs"
              />
            </div>
          </div>

          {/* Required Hours Settings */}
          <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200/80">
            <div>
              <label className="block text-[9px] font-extrabold text-neutral-600 uppercase tracking-wider mb-0.5 flex items-center gap-0.5">
                <Clock size={10} className="text-primary" /> Total Hours *
              </label>
              <input
                type="number"
                min={10}
                max={2000}
                required
                value={requiredHours}
                onChange={(e) => setRequiredHours(Number(e.target.value))}
                className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-neutral-800 font-extrabold focus:ring-2 focus:ring-primary/20 outline-none text-xs"
              />
            </div>
            <div>
              <label className="block text-[9px] font-extrabold text-neutral-600 uppercase tracking-wider mb-0.5">
                Daily Hours
              </label>
              <input
                type="number"
                min={4}
                max={10}
                required
                value={requiredHoursPerDay}
                onChange={(e) => setRequiredHoursPerDay(Number(e.target.value))}
                className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-neutral-800 font-extrabold focus:ring-2 focus:ring-primary/20 outline-none text-xs"
              />
            </div>
          </div>

          {/* Password & Confirm Password */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[9px] font-extrabold text-neutral-500 uppercase tracking-wider mb-0.5 flex items-center gap-0.5">
                <Lock size={10} className="text-primary" /> Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-neutral-800 focus:ring-2 focus:ring-primary/20 outline-none pr-7 text-xs font-bold"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                >
                  {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[9px] font-extrabold text-neutral-500 uppercase tracking-wider mb-0.5">
                Confirm *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-neutral-800 focus:ring-2 focus:ring-primary/20 outline-none pr-7 text-xs font-bold"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                >
                  {showConfirmPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-gradient-to-r from-primary via-orange-500 to-primary-dark text-white rounded-xl font-black text-xs shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 active:scale-[0.98] mt-1"
          >
            {loading ? 'Creating Account...' : 'Complete Registration'}
          </button>
        </form>

        <p className="text-center text-[10px] text-neutral-500 font-semibold pt-0.5">
          Already registered?{' '}
          <Link to="/ojt/login" className="text-primary font-extrabold hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
