/**
 * Device detection and phone naming utility
 */

export function detectPhoneModel(): string {
  const ua = navigator.userAgent;

  // iOS detection
  if (/iPhone/i.test(ua)) {
    // Screen dimensions can hint at iPhone model if desired, but "Apple iPhone" is clean & accurate
    return 'Apple iPhone';
  }
  if (/iPad/i.test(ua)) return 'Apple iPad';

  // Android detection
  if (/Android/i.test(ua)) {
    // Look for model pattern: "Android [ver]; [Model] Build"
    const match = ua.match(/Android[^;]+;(?:\s*Build[^;]+;)?\s*([^;)]+)/i);
    if (match && match[1]) {
      let model = match[1].replace(/Build\/.*/, '').replace(/Version\/.*/, '').trim();
      // Remove generic terms
      if (model && !/^(K|wv|Linux)$/i.test(model)) {
        return model; // e.g. "SM-S918B", "Pixel 8", "CPH2415"
      }
    }
    return 'Android Phone';
  }

  // Desktop / other
  if (/Windows NT/i.test(ua)) return 'Windows PC';
  if (/Macintosh/i.test(ua)) return 'MacBook / Mac';
  if (/Linux/i.test(ua)) return 'Linux Device';

  return 'Mobile Device';
}

const PHONE_NAME_STORAGE_KEY = 'iot-border-phone-name';

export function getStoredPhoneName(): string {
  try {
    const stored = localStorage.getItem(PHONE_NAME_STORAGE_KEY);
    if (stored && stored.trim()) {
      return stored.trim();
    }
  } catch {
    // ignore
  }
  return detectPhoneModel();
}

export function saveStoredPhoneName(name: string): void {
  try {
    localStorage.setItem(PHONE_NAME_STORAGE_KEY, name.trim());
  } catch {
    // ignore
  }
}
