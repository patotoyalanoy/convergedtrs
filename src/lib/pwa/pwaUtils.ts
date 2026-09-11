export function isInAppSocialBrowser(): boolean {
  if (typeof window === 'undefined' || !navigator.userAgent) return false;
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
  return (
    /FBAN|FBAV/i.test(ua) || // Facebook app / Messenger
    /Instagram/i.test(ua) || // Instagram
    /TikTok/i.test(ua) || // TikTok
    /Line\//i.test(ua) || // Line
    /MicroMessenger/i.test(ua) || // WeChat
    /Twitter/i.test(ua) || // Twitter
    /Snapchat/i.test(ua) // Snapchat
  );
}

export function getSocialBrowserName(): string {
  if (typeof window === 'undefined' || !navigator.userAgent) return 'Social App';
  const ua = navigator.userAgent;
  if (/Instagram/i.test(ua)) return 'Instagram';
  if (/FBAN|FBAV/i.test(ua)) return 'Facebook / Messenger';
  if (/TikTok/i.test(ua)) return 'TikTok';
  if (/Line\//i.test(ua)) return 'Line';
  if (/Twitter/i.test(ua)) return 'Twitter';
  return 'In-App Browser';
}

export function isPwaInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}
