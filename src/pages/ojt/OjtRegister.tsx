import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Lock, Eye, EyeOff, Clock, ArrowLeft } from 'lucide-react';
import { OjtService } from '@/services/ojt/ojtService';
import { useAuthStore } from '@/stores/useAuthStore';
import PwaInstallBanner from '@/components/common/PwaInstallBanner';
import SocialBrowserBanner from '@/components/common/SocialBrowserBanner';

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

  // Set OJT as the preferred portal so PWA opens to OJT login
  useEffect(() => {
    localStorage.setItem('preferred_portal', 'ojt');
  }, []);

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

      localStorage.setItem('preferred_portal', 'ojt');

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
    <div 
      className="relative min-h-screen w-full bg-[#0f172a] flex flex-col items-center justify-center p-3 sm:p-5 overflow-hidden"
      style={{ fontFamily: "'Century Gothic', CenturyGothic, AppleGothic, sans-serif" }}
    >
      {/* Social Browser & PWA Install Banners */}
      <SocialBrowserBanner />
      <PwaInstallBanner />

      {/* Grid Pattern Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff33_1px,transparent_1px),linear-gradient(to_bottom,#ffffff33_1px,transparent_1px)] bg-[size:6rem_4rem] pointer-events-none" />

      {/* Optimized Card for Mobile Screens */}
      <div className="relative z-10 w-full max-w-sm bg-white rounded-3xl p-5 sm:p-6 shadow-2xl space-y-3.5">
        <div className="flex items-center justify-between">
          <Link
            to="/ojt/login"
            className="flex items-center gap-1 text-xs font-black text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            <ArrowLeft size={15} /> Back to Sign In
          </Link>
          <span className="bg-primary/10 text-primary px-3 py-0.5 rounded-full text-xs font-black border border-primary/20">
            Registration
          </span>
        </div>

        <div className="text-center">
          <img
            src="/CSiLogo.png"
            alt="Converge IT Solutions Inc."
            decoding="sync"
            fetchPriority="high"
            className="h-10 object-contain mx-auto mb-2"
          />
          <h1 className="text-xl font-black text-neutral-900 leading-tight">
            Register OJT Account
          </h1>
          <p className="text-xs text-neutral-500 font-semibold mt-0.5">
            Fill in your details to create your OJT portal
          </p>
        </div>

        {error && (
          <p className="text-xs font-extrabold text-red-600 bg-red-50 py-2 px-3 rounded-xl border border-red-200 text-center">
            {error}
          </p>
        )}

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-2.5 text-xs font-semibold">
          {/* First Name & Last Name */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] font-black text-neutral-600 uppercase tracking-wider mb-1">
                First Name *
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-neutral-800 focus:ring-2 focus:ring-primary/20 outline-none text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-neutral-600 uppercase tracking-wider mb-1">
                Last Name *
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-neutral-800 focus:ring-2 focus:ring-primary/20 outline-none text-xs font-bold"
              />
            </div>
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] font-black text-neutral-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Mail size={11} className="text-primary" /> Email *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@school.edu"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-neutral-800 focus:ring-2 focus:ring-primary/20 outline-none text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-neutral-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Phone size={11} /> Contact No.
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="09171234567"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-neutral-800 focus:ring-2 focus:ring-primary/20 outline-none text-xs font-bold"
              />
            </div>
          </div>

          {/* School & Address */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] font-black text-neutral-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                School *
              </label>
              <input
                type="text"
                required
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                placeholder="University"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-neutral-800 focus:ring-2 focus:ring-primary/20 outline-none text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-neutral-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                <MapPin size={11} /> Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="City, Province"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-neutral-800 focus:ring-2 focus:ring-primary/20 outline-none text-xs font-bold"
              />
            </div>
          </div>

          {/* Required Hours Settings */}
          <div className="grid grid-cols-2 gap-2.5 bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80">
            <div>
              <label className="block text-[10px] font-black text-neutral-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Clock size={11} className="text-primary" /> Total Hours *
              </label>
              <input
                type="number"
                min={10}
                max={2000}
                required
                value={requiredHours}
                onChange={(e) => setRequiredHours(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-neutral-800 font-extrabold focus:ring-2 focus:ring-primary/20 outline-none text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-neutral-600 uppercase tracking-wider mb-1">
                Daily Hours
              </label>
              <input
                type="number"
                min={4}
                max={10}
                required
                value={requiredHoursPerDay}
                onChange={(e) => setRequiredHoursPerDay(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-neutral-800 font-extrabold focus:ring-2 focus:ring-primary/20 outline-none text-xs"
              />
            </div>
          </div>

          {/* Password & Confirm Password */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] font-black text-neutral-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Lock size={11} className="text-primary" /> Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-neutral-800 focus:ring-2 focus:ring-primary/20 outline-none pr-8 text-xs font-bold"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-neutral-600 uppercase tracking-wider mb-1">
                Confirm *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-neutral-800 focus:ring-2 focus:ring-primary/20 outline-none pr-8 text-xs font-bold"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                >
                  {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-primary via-orange-500 to-primary-dark text-white rounded-xl font-black text-xs shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 active:scale-[0.98] mt-1.5"
          >
            {loading ? 'Creating Account...' : 'Complete Registration'}
          </button>
        </form>

        <p className="text-center text-xs text-neutral-500 font-semibold pt-1">
          Already registered?{' '}
          <Link to="/ojt/login" className="text-primary font-extrabold hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
