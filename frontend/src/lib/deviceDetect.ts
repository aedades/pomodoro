/**
 * Device and browser detection utilities
 */

export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    // iPad on iOS 13+ reports as Mac
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

export function isSafari(): boolean {
  if (typeof navigator === 'undefined') return false;
  
  const ua = navigator.userAgent;
  return /Safari/.test(ua) && !/Chrome|CriOS|FxiOS/.test(ua);
}

export function isIOSSafari(): boolean {
  return isIOS() && isSafari();
}

export function isPWA(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check if running in standalone mode (added to home screen)
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari specific
    (window.navigator as any).standalone === true
  );
}

export function getIOSVersion(): number | null {
  if (!isIOS()) return null;
  
  const match = navigator.userAgent.match(/OS (\d+)_/);
  return match ? parseInt(match[1], 10) : null;
}

export function supportsWebPush(): boolean {
  // iOS 16.4+ supports Web Push for PWAs
  if (isIOS()) {
    const version = getIOSVersion();
    return version !== null && version >= 16 && isPWA();
  }
  
  // Most other browsers support it
  return 'Notification' in window && 'serviceWorker' in navigator;
}

export interface DeviceInfo {
  isIOS: boolean;
  isIOSSafari: boolean;
  isPWA: boolean;
  iosVersion: number | null;
  supportsWebPush: boolean;
  needsPWAInstall: boolean; // iOS but not installed as PWA
  needsIOSUpdate: boolean;  // iOS but version < 16.4
}

export function getDeviceInfo(): DeviceInfo {
  const ios = isIOS();
  const pwa = isPWA();
  const version = getIOSVersion();
  
  return {
    isIOS: ios,
    isIOSSafari: isIOSSafari(),
    isPWA: pwa,
    iosVersion: version,
    supportsWebPush: supportsWebPush(),
    needsPWAInstall: ios && !pwa,
    needsIOSUpdate: ios && version !== null && version < 16,
  };
}
