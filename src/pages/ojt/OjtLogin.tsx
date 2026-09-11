import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, Lock, Delete, ArrowLeft } from 'lucide-react';
import { OjtService } from '@/services/ojt/ojtService';
import { useAuthStore } from '@/stores/useAuthStore';

export default function OjtLogin() {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDigit = (d: string) => {
    if (loading || pin.length >= 4) return;
    setPin((p) => p + d);
    setError(null);
  };

  const handleDelete = () => {
    if (loading) return;
    setPin((p) => p.slice(0, -1));
    setError(null);
  };

  const handleSubmit = async () => {
    if (pin.length !== 4) {
      setError('Please enter a 4-digit PIN');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const students = await OjtService.getAllStudents();
      const match = students.find((s) => s.pinHash === pin || s.pinHash === String(pin));

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
        setError('Invalid PIN code. No matching OJT student record found.');
        setPin('');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center">
        <div className="flex items-center justify-between">
          <Link
            to="/login"
            className="flex items-center gap-1 text-xs font-bold text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            <ArrowLeft size={16} /> Regular Login
          </Link>
          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-extrabold border border-primary/20">
            OJT Student
          </span>
        </div>

        <div>
          <div className="w-16 h-16 bg-gradient-to-tr from-primary to-orange-400 text-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <GraduationCap size={32} />
          </div>
          <h1 className="text-2xl font-black text-neutral-900 leading-tight">
            OJT Student Portal
          </h1>
          <p className="text-xs text-neutral-500 font-semibold mt-1">
            Enter your 4-digit PIN code to log attendance & track hours
          </p>
        </div>

        {/* PIN Dots */}
        <div className="flex justify-center gap-3 my-4">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full border-2 transition-all ${
                pin.length > idx
                  ? 'bg-primary border-primary scale-110 shadow-md shadow-primary/30'
                  : 'border-slate-300 bg-slate-50'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-xs font-extrabold text-red-500 bg-red-50 py-2 rounded-xl border border-red-200">
            {error}
          </p>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-3 max-w-[260px] mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="h-14 rounded-2xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-800 font-black text-xl shadow-xs border border-slate-200 transition-all cursor-pointer"
            >
              {digit}
            </button>
          ))}
          <div />
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-14 rounded-2xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-800 font-black text-xl shadow-xs border border-slate-200 transition-all cursor-pointer"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="h-14 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 font-black flex items-center justify-center shadow-xs border border-red-200 transition-all cursor-pointer"
            title="Delete"
          >
            <Delete size={22} />
          </button>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || pin.length !== 4}
          className="w-full py-4 bg-gradient-to-r from-primary to-primary-dark text-white rounded-2xl font-black text-sm shadow-lg hover:shadow-xl transition-all cursor-pointer disabled:opacity-50 active:scale-[0.98]"
        >
          {loading ? 'Authenticating...' : 'Sign In to OJT Portal'}
        </button>

        <p className="text-xs text-neutral-500 font-semibold pt-2">
          Don't have an OJT account?{' '}
          <Link to="/ojt/register" className="text-primary font-extrabold hover:underline">
            Register Account
          </Link>
        </p>
      </div>
    </div>
  );
}
