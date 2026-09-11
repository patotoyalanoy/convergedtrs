import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { OjtService } from '@/services/ojt/ojtService';
import { useAuthStore } from '@/stores/useAuthStore';

export default function OjtLogin() {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter your Email and Password');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const students = await OjtService.getAllStudents();
      const match = students.find(
        (s) =>
          s.email.toLowerCase() === email.trim().toLowerCase() &&
          (s.passwordHash === password.trim() || s.passwordHash === String(password.trim()))
      );

      if (match) {
        login(
          {
            id: match.id,
            name: match.name,
            teamId: 'ojt-team',
            status: match.status,
            role: 'OJT Student',
          } as any,
          'employee'
        );
        navigate('/ojt/dashboard');
      } else {
        setError('Invalid Email or Password. Please check your credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-3 sm:p-4">
      {/* Compact Card Fits on Mobile Screens without Scroll */}
      <div className="w-full max-w-sm bg-white rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <Link
            to="/login"
            className="flex items-center gap-1 text-[11px] font-extrabold text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            <ArrowLeft size={14} /> Regular Login
          </Link>
          <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-[10px] font-black border border-primary/20">
            OJT Student
          </span>
        </div>

        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-tr from-primary to-orange-400 text-white rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-md">
            <GraduationCap size={26} />
          </div>
          <h1 className="text-xl font-black text-neutral-900 leading-tight">
            OJT Student Portal
          </h1>
          <p className="text-[11px] text-neutral-500 font-semibold mt-0.5">
            Sign in with your Email & Password to track OJT hours
          </p>
        </div>

        {error && (
          <p className="text-xs font-extrabold text-red-600 bg-red-50 py-2 px-3 rounded-xl border border-red-200 text-center">
            {error}
          </p>
        )}

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3 text-xs font-semibold">
          <div>
            <label className="block text-[10px] font-extrabold text-neutral-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Mail size={12} className="text-primary" /> Email Address
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
            <label className="block text-[10px] font-extrabold text-neutral-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Lock size={12} className="text-primary" /> Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-neutral-800 focus:ring-2 focus:ring-primary/20 outline-none pr-10 font-bold"
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

          <button
            type="submit"
            disabled={loading || !email.trim() || !password.trim()}
            className="w-full py-3 bg-gradient-to-r from-primary via-orange-500 to-primary-dark text-white rounded-xl font-black text-xs shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 active:scale-[0.98] mt-1"
          >
            {loading ? 'Authenticating...' : 'Sign In to OJT Portal'}
          </button>
        </form>

        <p className="text-center text-[11px] text-neutral-500 font-semibold pt-1">
          Don't have an account?{' '}
          <Link to="/ojt/register" className="text-primary font-extrabold hover:underline">
            Register Account
          </Link>
        </p>
      </div>
    </div>
  );
}
