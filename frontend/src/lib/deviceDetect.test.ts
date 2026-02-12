import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isIOS,
  isSafari,
  isIOSSafari,
  isPWA,
  getIOSVersion,
  supportsWebPush,
  getDeviceInfo,
} from './deviceDetect';

describe('deviceDetect', () => {
  const originalNavigator = global.navigator;
  const originalWindow = global.window;

  beforeEach(() => {
    // Reset mocks before each test
    vi.stubGlobal('navigator', { ...originalNavigator });
    vi.stubGlobal('window', { ...originalWindow });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('isIOS', () => {
    it('returns true for iPhone user agent', () => {
      vi.stubGlobal('navigator', {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
        platform: 'iPhone',
        maxTouchPoints: 5,
      });
      expect(isIOS()).toBe(true);
    });

    it('returns true for iPad user agent', () => {
      vi.stubGlobal('navigator', {
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)',
        platform: 'iPad',
        maxTouchPoints: 5,
      });
      expect(isIOS()).toBe(true);
    });

    it('returns true for iPad on iOS 13+ (reports as Mac)', () => {
      vi.stubGlobal('navigator', {
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        platform: 'MacIntel',
        maxTouchPoints: 5,
      });
      expect(isIOS()).toBe(true);
    });

    it('returns false for actual Mac', () => {
      vi.stubGlobal('navigator', {
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        platform: 'MacIntel',
        maxTouchPoints: 0,
      });
      expect(isIOS()).toBe(false);
    });

    it('returns false for Android', () => {
      vi.stubGlobal('navigator', {
        userAgent: 'Mozilla/5.0 (Linux; Android 13)',
        platform: 'Linux',
        maxTouchPoints: 5,
      });
      expect(isIOS()).toBe(false);
    });

    it('returns false for Windows', () => {
      vi.stubGlobal('navigator', {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        platform: 'Win32',
        maxTouchPoints: 0,
      });
      expect(isIOS()).toBe(false);
    });
  });

  describe('isSafari', () => {
    it('returns true for Safari', () => {
      vi.stubGlobal('navigator', {
        userAgent: 'Mozilla/5.0 (Macintosh) AppleWebKit/605.1.15 Safari/605.1.15',
      });
      expect(isSafari()).toBe(true);
    });

    it('returns false for Chrome', () => {
      vi.stubGlobal('navigator', {
        userAgent: 'Mozilla/5.0 Chrome/120.0.0.0 Safari/537.36',
      });
      expect(isSafari()).toBe(false);
    });

    it('returns false for Chrome on iOS', () => {
      vi.stubGlobal('navigator', {
        userAgent: 'Mozilla/5.0 (iPhone) CriOS/120.0.0.0 Safari/604.1',
      });
      expect(isSafari()).toBe(false);
    });

    it('returns false for Firefox on iOS', () => {
      vi.stubGlobal('navigator', {
        userAgent: 'Mozilla/5.0 (iPhone) FxiOS/120.0 Safari/605.1.15',
      });
      expect(isSafari()).toBe(false);
    });
  });

  describe('isIOSSafari', () => {
    it('returns true for Safari on iPhone', () => {
      vi.stubGlobal('navigator', {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Safari/605.1.15',
        platform: 'iPhone',
        maxTouchPoints: 5,
      });
      expect(isIOSSafari()).toBe(true);
    });

    it('returns false for Chrome on iPhone', () => {
      vi.stubGlobal('navigator', {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) CriOS/120.0.0.0 Safari/604.1',
        platform: 'iPhone',
        maxTouchPoints: 5,
      });
      expect(isIOSSafari()).toBe(false);
    });
  });

  describe('getIOSVersion', () => {
    it('returns version number for iOS user agent', () => {
      vi.stubGlobal('navigator', {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
        platform: 'iPhone',
        maxTouchPoints: 5,
      });
      expect(getIOSVersion()).toBe(17);
    });

    it('returns version for iOS 16', () => {
      vi.stubGlobal('navigator', {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_4 like Mac OS X)',
        platform: 'iPhone',
        maxTouchPoints: 5,
      });
      expect(getIOSVersion()).toBe(16);
    });

    it('returns null for non-iOS', () => {
      vi.stubGlobal('navigator', {
        userAgent: 'Mozilla/5.0 (Linux; Android 13)',
        platform: 'Linux',
        maxTouchPoints: 5,
      });
      expect(getIOSVersion()).toBe(null);
    });
  });

  describe('isPWA', () => {
    it('returns true when in standalone mode', () => {
      vi.stubGlobal('window', {
        matchMedia: (query: string) => ({
          matches: query === '(display-mode: standalone)',
        }),
        navigator: { standalone: false },
      });
      expect(isPWA()).toBe(true);
    });

    it('returns true for iOS standalone', () => {
      vi.stubGlobal('window', {
        matchMedia: () => ({ matches: false }),
        navigator: { standalone: true },
      });
      expect(isPWA()).toBe(true);
    });

    it('returns false when not installed', () => {
      vi.stubGlobal('window', {
        matchMedia: () => ({ matches: false }),
        navigator: { standalone: false },
      });
      expect(isPWA()).toBe(false);
    });
  });

  describe('supportsWebPush', () => {
    it('returns true for non-iOS with Notification support', () => {
      vi.stubGlobal('navigator', {
        userAgent: 'Mozilla/5.0 Chrome/120.0.0.0',
        platform: 'Win32',
        maxTouchPoints: 0,
        serviceWorker: {},
      });
      vi.stubGlobal('window', {
        Notification: {},
        matchMedia: () => ({ matches: false }),
        navigator: { standalone: false, serviceWorker: {} },
      });
      expect(supportsWebPush()).toBe(true);
    });

    it('returns false for iOS not in PWA mode', () => {
      vi.stubGlobal('navigator', {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
        platform: 'iPhone',
        maxTouchPoints: 5,
        serviceWorker: {},
      });
      vi.stubGlobal('window', {
        Notification: {},
        matchMedia: () => ({ matches: false }),
        navigator: { standalone: false, serviceWorker: {} },
      });
      expect(supportsWebPush()).toBe(false);
    });

    it('returns true for iOS 16+ in PWA mode', () => {
      vi.stubGlobal('navigator', {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
        platform: 'iPhone',
        maxTouchPoints: 5,
        serviceWorker: {},
      });
      vi.stubGlobal('window', {
        Notification: {},
        matchMedia: () => ({ matches: true }), // standalone mode
        navigator: { standalone: true, serviceWorker: {} },
      });
      expect(supportsWebPush()).toBe(true);
    });
  });

  describe('getDeviceInfo', () => {
    it('returns correct info for iPhone not installed as PWA', () => {
      vi.stubGlobal('navigator', {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Safari/605.1.15',
        platform: 'iPhone',
        maxTouchPoints: 5,
        serviceWorker: {},
      });
      vi.stubGlobal('window', {
        Notification: {},
        matchMedia: () => ({ matches: false }),
        navigator: { standalone: false, serviceWorker: {} },
      });

      const info = getDeviceInfo();
      expect(info.isIOS).toBe(true);
      expect(info.isIOSSafari).toBe(true);
      expect(info.isPWA).toBe(false);
      expect(info.iosVersion).toBe(17);
      expect(info.needsPWAInstall).toBe(true);
      expect(info.needsIOSUpdate).toBe(false);
    });

    it('returns needsIOSUpdate for old iOS', () => {
      vi.stubGlobal('navigator', {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
        platform: 'iPhone',
        maxTouchPoints: 5,
      });
      vi.stubGlobal('window', {
        matchMedia: () => ({ matches: false }),
        navigator: { standalone: false },
      });

      const info = getDeviceInfo();
      expect(info.iosVersion).toBe(15);
      expect(info.needsIOSUpdate).toBe(true);
    });
  });
});
