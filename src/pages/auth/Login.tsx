import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { Delete, Loader2, WifiOff } from 'lucide-react';
import { clsx } from 'clsx';
import { supabase } from '@/lib/supabase/client';

type LoginRole = 'employee' | 'admin';
const MAX_ATTEMPTS = 5;

export default function Login() {
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<LoginRole>('employee');
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);
  const [isOnline] = useState(navigator.onLine);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (!locked) return;
    setLockTimer(30);
    const interval = setInterval(() => {
      setLockTimer((t) => {
        if (t <= 1) {
          clearInterval(interval);
          setLocked(false);
          setAttempts(0);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [locked]);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleDigit = (d: string) => {
    if (locked || loading || pin.length >= 4) return;
    setPin((p) => p + d);
    setError(null);
  };

  const handleDelete = () => {
    if (locked || loading) return;
    setPin((p) => p.slice(0, -1));
    setError(null);
  };

  const handleSubmit = async () => {
    if (pin.length < 4 || loading || locked) return;
    setLoading(true);
    setError(null);

    try {
      if (role === 'admin') {
        // Query admin_users table in Supabase by pin_hash
        const { data, error: queryErr } = await supabase
          .from('admin_users')
          .select('*')
          .eq('pin_hash', pin);

        if (queryErr) {
          console.error('Admin query error:', queryErr);
          setError('Database connection error. Please try again.');
          setLoading(false);
          return;
        }

        if (data && data.length > 0) {
          const adminObj = data[0];
          login(
            {
              id: adminObj.id,
              name: adminObj.name || 'Admin User',
              email: adminObj.email || 'admin@converge.com',
              role: adminObj.role || 'admin',
            } as any,
            'admin'
          );
          navigate('/admin');
          setLoading(false);
          return;
        }
      } else {
        // Query employees table in Supabase by pin_hash
        const { data, error: queryErr } = await supabase
          .from('employees')
          .select('*')
          .eq('pin_hash', pin);

        if (queryErr) {
          console.error('Employee query error:', queryErr);
          setError('Database connection error. Please try again.');
          setLoading(false);
          return;
        }

        if (data && data.length > 0) {
          const empObj = data[0];
          login(
            {
              id: empObj.id,
              name: empObj.name,
              teamId: empObj.team_id || 'team-1',
              status: empObj.status || 'active',
              role: empObj.role || 'Technician',
            } as any,
            'employee'
          );
          navigate('/');
          setLoading(false);
          return;
        }
      }

      // If no match found in Supabase
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setPin('');
      triggerShake();
      if (newAttempts >= MAX_ATTEMPTS) {
        setLocked(true);
        setError('Too many attempts. Locked for 30 seconds.');
      } else {
        setError(`Incorrect PIN. ${MAX_ATTEMPTS - newAttempts} attempt${MAX_ATTEMPTS - newAttempts !== 1 ? 's' : ''} remaining.`);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred while connecting to Supabase.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSwitch = (r: LoginRole) => {
    setRole(r);
    setPin('');
    setError(null);
  };

  const isEmployee = role === 'employee';
  const accentColor = isEmployee ? '#F97316' : '#5B6DB5';
  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-orange-50 flex flex-col items-center justify-center px-5 py-10">

      {/* Offline Banner */}
      {!isOnline && (
        <div className="w-full max-w-sm mb-4 bg-red-500 text-white text-xs font-medium py-2 px-4 rounded-xl flex items-center justify-center gap-2">
          <WifiOff size={13} /> No internet — offline mode active
        </div>
      )}

      {/* ── Single Unified Card ── */}
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl shadow-neutral-200 border border-neutral-100 overflow-hidden">

        {/* ── Logo Section ── */}
        <div className="flex flex-col items-center pt-8 pb-6 px-6 bg-gradient-to-b from-neutral-50 to-white border-b border-neutral-100">
          <img
            src="/CSiLogo.png"
            alt="Converge IT Solutions Inc."
            className="h-14 object-contain mb-4"
          />
          <div
            className="text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full border"
            style={{ color: accentColor, borderColor: `${accentColor}40`, backgroundColor: `${accentColor}10` }}
          >
            DTRS · Daily Time Record System
          </div>
        </div>

        {/* ── Role Toggle ── */}
        <div className="px-6 pt-5 pb-1">
          <div className="flex bg-neutral-100 rounded-2xl p-1 gap-1">
            <button
              onClick={() => handleRoleSwitch('employee')}
              className={clsx(
                'flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200',
                isEmployee ? 'bg-white text-[#F97316] shadow-sm' : 'text-neutral-400 hover:text-neutral-600'
              )}
            >
              Employee
            </button>
            <button
              onClick={() => handleRoleSwitch('admin')}
              className={clsx(
                'flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200',
                !isEmployee ? 'bg-white text-[#5B6DB5] shadow-sm' : 'text-neutral-400 hover:text-neutral-600'
              )}
            >
              Admin
            </button>
          </div>
        </div>

        {/* ── PIN Dots ── */}
        <div className="px-6 pt-5 pb-2">
          <p className="text-center text-xs text-neutral-500 mb-3 font-medium">
            Enter your 4-digit {isEmployee ? 'Employee' : 'Admin'} PIN
          </p>
          <div
            className={clsx(
              'flex gap-4 justify-center transition-transform duration-100',
              shake && 'translate-x-2'
            )}
          >
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={clsx(
                  'w-4 h-4 rounded-full border-2 transition-all duration-150',
                  i < pin.length ? 'scale-125 border-transparent' : 'border-neutral-300 bg-white'
                )}
                style={i < pin.length ? { backgroundColor: accentColor } : {}}
              />
            ))}
          </div>

          {/* Error / status */}
          <div className="min-h-[28px] mt-3 text-center">
            {locked ? (
              <p className="text-red-500 text-xs font-semibold">
                Locked — retry in {lockTimer}s
              </p>
            ) : error ? (
              <p className="text-red-500 text-xs font-medium">{error}</p>
            ) : (
              <p className="text-neutral-400 text-xs">
                Connected to Supabase Database
              </p>
            )}
          </div>
        </div>

        {/* ── Keypad ── */}
        <div className="px-6 pb-6">
          <div className="grid grid-cols-3 gap-3 mb-4">
            {digits.map((d, i) => {
              if (d === '') return <div key={i} />;

              if (d === 'del') {
                return (
                  <button
                    key={i}
                    onClick={handleDelete}
                    disabled={locked || loading}
                    className="h-16 rounded-2xl bg-white border border-neutral-200 shadow-sm hover:bg-neutral-100 active:scale-95 transition-all flex items-center justify-center text-neutral-600 disabled:opacity-40"
                  >
                    <Delete size={24} />
                  </button>
                );
              }

              return (
                <button
                  key={i}
                  onClick={() => handleDigit(d)}
                  disabled={locked || loading}
                  className={clsx(
                    'h-16 rounded-2xl font-black text-2xl transition-all active:scale-95 disabled:opacity-40 text-neutral-800 bg-white border border-neutral-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:bg-neutral-50',
                    isEmployee
                      ? 'hover:border-[#F97316] hover:text-[#F97316]'
                      : 'hover:border-[#5B6DB5] hover:text-[#5B6DB5]'
                  )}
                >
                  {d}
                </button>
              );
            })}
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={pin.length < 4 || loading || locked}
            className={clsx(
              'w-full py-4 rounded-2xl font-bold text-white text-base transition-all active:scale-95 flex items-center justify-center gap-2',
              (pin.length < 4 || loading || locked) ? 'opacity-50 cursor-not-allowed active:scale-100' : ''
            )}
            style={{ backgroundColor: accentColor }}
          >
            {loading ? <><Loader2 size={20} className="animate-spin" /> Authenticating...</> : 'Login'}
          </button>
        </div>
      </div>

      {/* Footer */}
      <p className="text-neutral-400 text-xs mt-6 text-center">
        © {new Date().getFullYear()} Converge IT Solutions Inc.
      </p>
    </div>
  );
}
