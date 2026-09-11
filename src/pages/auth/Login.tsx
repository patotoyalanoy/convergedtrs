import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { Delete, Loader2, WifiOff, GraduationCap } from 'lucide-react';
import { clsx } from 'clsx';
import { supabase } from '@/lib/supabase/client';
import { db } from '@/lib/indexedDB';

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

    if (!isOnline) {
      try {
        const cached = await db.auth.where('pinHash').equals(pin).first();
        if (cached && cached.role === role) {
          login(
            {
              id: cached.id,
              name: cached.name,
              email: cached.email || '',
              role: cached.role as any,
            } as any,
            cached.role as any
          );
          navigate(cached.role === 'admin' ? '/admin' : '/');
          setLoading(false);
          return;
        } else {
          setError('No cached credentials available for offline login.');
          setLoading(false);
          return;
        }
      } catch (e) {
        console.error('Offline login error:', e);
        setError('Failed to access offline cache.');
        setLoading(false);
        return;
      }
    }
    try {
      if (role === 'admin') {
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
          await db.auth.put({
            id: adminObj.id,
            token: '',
            name: adminObj.name || 'Admin User',
            role: adminObj.role || 'admin',
            pinHash: pin,
            expiresAt: Date.now() + 24 * 60 * 60 * 1000,
            email: adminObj.email || 'admin@converge.com',
          });
          navigate('/admin');
          setLoading(false);
          return;
        }
      } else {
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
          await db.auth.put({
            id: empObj.id,
            token: '',
            name: empObj.name,
            role: empObj.role || 'Technician',
            pinHash: pin,
            expiresAt: Date.now() + 24 * 60 * 60 * 1000,
          });
          navigate('/');
          setLoading(false);
          return;
        }
      }

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
      setError('An error occurred while connecting to database.');
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
    <div 
      className="relative min-h-screen w-full bg-[#0f172a] flex flex-col items-center justify-center p-3 sm:p-5 overflow-hidden"
      style={{ fontFamily: "'Century Gothic', CenturyGothic, AppleGothic, sans-serif" }}
    >
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff33_1px,transparent_1px),linear-gradient(to_bottom,#ffffff33_1px,transparent_1px)] bg-[size:6rem_4rem] pointer-events-none" />

      {/* Offline Banner */}
      {!isOnline && (
        <div className="relative z-10 w-full max-w-sm mb-3 bg-red-500 text-white text-xs font-medium py-1.5 px-3 rounded-xl flex items-center justify-center gap-2 shadow-lg">
          <WifiOff size={13} /> No internet — offline mode active
        </div>
      )}

      {/* ── Compact Unified Card (Fits Mobile Screens) ── */}
      <div className="relative z-10 w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-neutral-100 overflow-hidden">

        {/* ── Logo Section ── */}
        <div className="flex flex-col items-center pt-5 pb-3 px-5 bg-gradient-to-b from-neutral-50 to-white border-b border-neutral-100">
          <img
            src="/CSiLogo.png"
            alt="Converge IT Solutions Inc."
            decoding="sync"
            fetchPriority="high"
            className="h-10 object-contain mb-2"
          />
          <div
            className="text-[10px] font-black tracking-widest uppercase px-3 py-0.5 rounded-full border"
            style={{ color: accentColor, borderColor: `${accentColor}40`, backgroundColor: `${accentColor}10` }}
          >
            DTRS · Daily Time Record System
          </div>
        </div>

        {/* ── Role Toggle ── */}
        <div className="px-5 pt-3 pb-1">
          <div className="flex bg-neutral-100 rounded-2xl p-1 gap-1">
            <button
              onClick={() => handleRoleSwitch('employee')}
              className={clsx(
                'flex-1 py-1.5 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer',
                isEmployee ? 'bg-white text-[#F97316] shadow-sm' : 'text-neutral-400 hover:text-neutral-600'
              )}
            >
              Employee
            </button>
            <button
              onClick={() => handleRoleSwitch('admin')}
              className={clsx(
                'flex-1 py-1.5 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer',
                !isEmployee ? 'bg-white text-[#5B6DB5] shadow-sm' : 'text-neutral-400 hover:text-neutral-600'
              )}
            >
              Admin
            </button>
          </div>
        </div>

        {/* ── PIN Dots ── */}
        <div className="px-5 pt-3 pb-1">
          <p className="text-center text-[11px] text-neutral-500 mb-2 font-bold">
            Enter 4-digit {isEmployee ? 'Employee' : 'Admin'} PIN
          </p>
          <div
            className={clsx(
              'flex gap-3 justify-center transition-transform duration-100',
              shake && 'translate-x-2'
            )}
          >
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={clsx(
                  'w-3.5 h-3.5 rounded-full border-2 transition-all duration-150',
                  i < pin.length ? 'scale-110 border-transparent' : 'border-neutral-300 bg-white'
                )}
                style={i < pin.length ? { backgroundColor: accentColor } : {}}
              />
            ))}
          </div>

          {/* Error / status */}
          <div className="min-h-[22px] mt-2 text-center">
            {locked ? (
              <p className="text-red-500 text-[11px] font-bold">
                Locked — retry in {lockTimer}s
              </p>
            ) : error ? (
              <p className="text-red-500 text-[11px] font-bold">{error}</p>
            ) : (
              <p className="text-neutral-400 text-[10px] font-medium">
                Connected to Database
              </p>
            )}
          </div>
        </div>

        {/* ── Compact Keypad ── */}
        <div className="px-5 pb-5">
          <div className="grid grid-cols-3 gap-2 mb-3">
            {digits.map((d, i) => {
              if (d === '') return <div key={i} />;

              if (d === 'del') {
                return (
                  <button
                    key={i}
                    onClick={handleDelete}
                    disabled={locked || loading}
                    className="h-11 sm:h-12 rounded-xl bg-white border border-neutral-200 shadow-xs hover:bg-neutral-100 active:scale-95 transition-all flex items-center justify-center text-neutral-600 disabled:opacity-40 cursor-pointer"
                  >
                    <Delete size={20} />
                  </button>
                );
              }

              return (
                <button
                  key={i}
                  onClick={() => handleDigit(d)}
                  disabled={locked || loading}
                  className={clsx(
                    'h-11 sm:h-12 rounded-xl font-black text-xl transition-all active:scale-95 disabled:opacity-40 text-neutral-800 bg-white border border-neutral-200 shadow-[0_2px_6px_-4px_rgba(0,0,0,0.1)] hover:bg-neutral-50 cursor-pointer',
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
              'w-full py-2.5 rounded-xl font-extrabold text-white text-xs sm:text-sm transition-all active:scale-95 flex items-center justify-center gap-2 shadow-md cursor-pointer',
              (pin.length < 4 || loading || locked) ? 'opacity-50 cursor-not-allowed active:scale-100' : ''
            )}
            style={{ backgroundColor: accentColor }}
          >
            {loading ? <><Loader2 size={16} className="animate-spin" /> Authenticating...</> : 'Sign In'}
          </button>

          {/* OJT Portal Link */}
          <div className="mt-3 pt-2.5 border-t border-neutral-100 text-center">
            <a
              href="/ojt/login"
              className="inline-flex items-center gap-1 text-[11px] font-black text-primary hover:underline bg-primary/5 px-3 py-1 rounded-xl border border-primary/10 transition-colors"
            >
              <GraduationCap size={14} /> OJT Student Portal →
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <p className="relative z-10 text-slate-400 text-[11px] font-semibold mt-4 text-center">
        © {new Date().getFullYear()} Converge IT Solutions Inc.
      </p>
    </div>
  );
}
