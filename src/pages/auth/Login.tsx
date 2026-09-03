import { useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { Delete, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

export default function Login() {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loginAs, setLoginAs] = useState<'employee' | 'admin'>('employee');

  const handleDigit = (d: string) => {
    if (pin.length < 4) setPin((p) => p + d);
  };

  const handleDelete = () => setPin((p) => p.slice(0, -1));

  const handleSubmit = async () => {
    if (pin.length < 4) return;
    setLoading(true);
    setError(null);

    // Simulate PIN check (replace with real Supabase call)
    await new Promise((r) => setTimeout(r, 800));

    if (pin === '1234') {
      if (loginAs === 'admin') {
        login({ id: 'admin-1', name: 'Admin User', role: 'admin' } as any, 'admin');
        navigate('/admin');
      } else {
        login({ id: 'emp-1', name: 'John Dela Cruz', teamId: 'team-1', status: 'active', role: 'Technician' } as any, 'employee');
        navigate('/');
      }
    } else {
      setError('Incorrect PIN. Please try again.');
      setPin('');
    }
    setLoading(false);
  };

  const digits = ['1','2','3','4','5','6','7','8','9','','0','del'];

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">

      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
            <span className="text-white font-black text-xs">C</span>
          </div>
          <span className="text-xl font-black text-secondary tracking-tight">CONVERGE-DTRS</span>
        </div>
        <p className="text-neutral-400 text-sm">Daily Time Record System</p>
      </div>

      {/* Role Toggle */}
      <div className="flex bg-neutral-100 rounded-xl p-1 mb-8 w-full max-w-xs">
        <button
          onClick={() => { setLoginAs('employee'); setPin(''); setError(null); }}
          className={clsx("flex-1 py-2 rounded-lg text-sm font-semibold transition-colors", loginAs === 'employee' ? "bg-white text-primary shadow-sm" : "text-neutral-500")}
        >
          Employee
        </button>
        <button
          onClick={() => { setLoginAs('admin'); setPin(''); setError(null); }}
          className={clsx("flex-1 py-2 rounded-lg text-sm font-semibold transition-colors", loginAs === 'admin' ? "bg-white text-secondary shadow-sm" : "text-neutral-500")}
        >
          Admin
        </button>
      </div>

      <p className="text-neutral-500 text-sm mb-6">Enter your PIN to continue</p>

      {/* PIN Dots */}
      <div className="flex gap-4 mb-4">
        {[0,1,2,3].map((i) => (
          <div
            key={i}
            className={clsx(
              "w-4 h-4 rounded-full border-2 transition-colors",
              i < pin.length
                ? loginAs === 'employee' ? "bg-primary border-primary" : "bg-secondary border-secondary"
                : "border-neutral-300"
            )}
          />
        ))}
      </div>

      {/* Error */}
      {error && (
        <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
      )}

      <p className="text-xs text-neutral-400 mb-8">Use PIN: <strong>1234</strong> for demo</p>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-4 w-full max-w-xs mb-6">
        {digits.map((d, i) => {
          if (d === '') return <div key={i} />;
          if (d === 'del') return (
            <button key={i} onClick={handleDelete} className="h-16 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-500 hover:bg-neutral-200 active:scale-95 transition-all">
              <Delete size={22} />
            </button>
          );
          return (
            <button
              key={i}
              onClick={() => handleDigit(d)}
              className="h-16 rounded-2xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-2xl active:scale-95 transition-all"
            >
              {d}
            </button>
          );
        })}
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={pin.length < 4 || loading}
        className={clsx(
          "w-full max-w-xs py-4 rounded-xl font-bold text-white text-lg transition-all active:scale-95 flex items-center justify-center gap-2",
          loginAs === 'employee' ? "bg-primary hover:bg-primary-dark" : "bg-secondary hover:bg-secondary-dark",
          (pin.length < 4 || loading) && "opacity-50 cursor-not-allowed active:scale-100"
        )}
      >
        {loading ? <Loader2 size={22} className="animate-spin" /> : 'Login'}
      </button>
    </div>
  );
}
