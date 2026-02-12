import { useState, useEffect } from 'react';
import { getDeviceInfo, DeviceInfo } from '../lib/deviceDetect';

interface IOSInstructionsProps {
  onDismiss: () => void;
  notificationPermission: NotificationPermission;
}

export function IOSInstructions({ onDismiss, notificationPermission }: IOSInstructionsProps) {
  const [device, setDevice] = useState<DeviceInfo | null>(null);
  const [step] = useState(1); // For future multi-step flow (eslint-disable-line)

  useEffect(() => {
    setDevice(getDeviceInfo());
  }, []);

  if (!device) return null;

  // Don't show if not iOS
  if (!device.isIOS) return null;

  // Don't show if everything is set up
  if (device.isPWA && notificationPermission === 'granted') return null;

  // iOS version too old
  if (device.needsIOSUpdate) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full p-6 shadow-xl">
          <div className="text-center">
            <div className="text-5xl mb-4">📱</div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              iOS Update Required
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Push notifications require <strong>iOS 16.4 or later</strong>.
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              Your version: iOS {device.iosVersion}
            </p>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">
              Go to <strong>Settings → General → Software Update</strong> to update your iPhone.
            </p>
            <button
              onClick={onDismiss}
              className="w-full py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-xl font-medium"
            >
              I'll update later
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Need to install as PWA
  if (device.needsPWAInstall) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full p-6 shadow-xl">
          <div className="text-center">
            {step === 1 && (
              <>
                <div className="text-5xl mb-4">🍅</div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Add to Home Screen
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  To get notifications when your timer ends, you need to install this app to your home screen.
                </p>
                <div className="text-left space-y-4 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 dark:text-blue-300 font-bold">1</span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-200 pt-1">
                      Tap the <strong>Share button</strong>{' '}
                      <span className="inline-block w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded text-center leading-6">
                        ↑
                      </span>{' '}
                      at the bottom of Safari
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 dark:text-blue-300 font-bold">2</span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-200 pt-1">
                      Scroll down and tap <strong>"Add to Home Screen"</strong>
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 dark:text-blue-300 font-bold">3</span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-200 pt-1">
                      Tap <strong>"Add"</strong> in the top right
                    </p>
                  </div>
                </div>
                <button
                  onClick={onDismiss}
                  className="w-full py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-xl font-medium"
                >
                  I'll do this later
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // PWA installed but notifications not enabled
  if (device.isPWA && notificationPermission !== 'granted') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full p-6 shadow-xl">
          <div className="text-center">
            <div className="text-5xl mb-4">🔔</div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Enable Notifications
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Allow notifications to get alerted when your timer ends, even with your screen locked.
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              You can change this anytime in Settings.
            </p>
            <button
              onClick={onDismiss}
              className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors"
            >
              Enable Notifications
            </button>
            <button
              onClick={onDismiss}
              className="w-full py-3 mt-2 text-gray-500 dark:text-gray-400"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

/**
 * Small banner for iOS users who haven't installed the PWA
 */
export function IOSInstallBanner({ onTap }: { onTap: () => void }) {
  const [device, setDevice] = useState<DeviceInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDevice(getDeviceInfo());
    // Check if user previously dismissed
    const wasDismissed = localStorage.getItem('ios-install-banner-dismissed');
    if (wasDismissed) setDismissed(true);
  }, []);

  if (!device || !device.needsPWAInstall || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('ios-install-banner-dismissed', 'true');
  };

  return (
    <div className="bg-blue-500 text-white px-4 py-3 flex items-center justify-between">
      <button onClick={onTap} className="flex-1 text-left">
        <span className="font-medium">📲 Add to Home Screen</span>
        <span className="text-blue-100 text-sm ml-2">for notifications</span>
      </button>
      <button
        onClick={handleDismiss}
        className="ml-2 p-1 hover:bg-blue-600 rounded"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}
