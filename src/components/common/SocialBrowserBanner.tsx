import { useState, useEffect } from 'react';
import { ExternalLink, Copy, Check, AlertTriangle, X } from 'lucide-react';
import { isInAppSocialBrowser, getSocialBrowserName } from '@/lib/pwa/pwaUtils';

export default function SocialBrowserBanner() {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);
  const [appName, setAppName] = useState('');

  useEffect(() => {
    if (isInAppSocialBrowser()) {
      setShow(true);
      setAppName(getSocialBrowserName());
    }
  }, []);

  if (!show) return null;

  const currentUrl = window.location.href;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="bg-amber-500 text-white px-4 py-3 shadow-lg border-b border-amber-600 relative z-[9999] animate-fadeIn">
      <div className="max-w-4xl mx-auto flex items-start gap-3 text-xs sm:text-sm">
        <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0 mt-0.5 font-bold">
          <AlertTriangle size={18} className="text-white" />
        </div>
        <div className="flex-1">
          <p className="font-extrabold text-white leading-tight">
            Opened inside {appName}?
          </p>
          <p className="text-amber-100 text-[11px] sm:text-xs mt-0.5 leading-relaxed">
            In-app browsers block app installation and offline attendance. For the best experience and to install as an app:
            <span className="font-bold text-white block mt-1">
              Tap the 3 dots (⋮) at top-right and select "Open in Chrome" or "Open in Safari".
            </span>
          </p>
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={handleCopyLink}
              className="bg-white text-amber-900 font-extrabold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-transform cursor-pointer"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              {copied ? 'Link Copied!' : 'Copy Link'}
            </button>
            <a
              href={currentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 shadow-sm transition-colors"
            >
              <ExternalLink size={14} /> Open External
            </a>
          </div>
        </div>
        <button
          onClick={() => setShow(false)}
          className="p-1 hover:bg-white/20 rounded-lg text-amber-100 hover:text-white transition-colors cursor-pointer"
          title="Dismiss"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
