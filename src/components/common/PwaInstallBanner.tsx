import { useState, useEffect } from 'react';
import { Download, Smartphone, X, CheckCircle2 } from 'lucide-react';
import { isPwaInstalled } from '@/lib/pwa/pwaUtils';

export default function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (isPwaInstalled()) {
      setInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    const handleAppInstalled = () => {
      setInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstalled(true);
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  if (installed || !showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-[9990] bg-neutral-900 text-white p-4 rounded-2xl shadow-2xl border border-neutral-700/80 backdrop-blur-md animate-bounce-short">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 font-black shadow-md">
          <Smartphone size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-extrabold text-sm text-white leading-tight">
            Install Converge DTRS App
          </h4>
          <p className="text-xs text-neutral-300 mt-0.5 truncate">
            Install for fast offline access & time-in controls.
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleInstallClick}
            className="bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-orange-600 text-white font-extrabold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <Download size={14} /> Install
          </button>
          <button
            onClick={() => setShowBanner(false)}
            className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors cursor-pointer"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
