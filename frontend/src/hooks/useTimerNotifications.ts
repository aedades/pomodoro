import { useCallback, useRef } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app, isFirebaseConfigured } from '../lib/firebase';
import { useNotifications } from './useNotifications';
import { useAuth } from './useAuth';

interface ScheduleResponse {
  timerId: string;
}

export function useTimerNotifications() {
  const { token, requestPermission, permission, supported } = useNotifications();
  const { isAuthenticated } = useAuth();
  const activeTimerRef = useRef<string | null>(null);

  const scheduleNotification = useCallback(
    async (durationMs: number, type: 'focus' | 'shortBreak' | 'longBreak') => {
      // Only schedule if we have permission, user is authenticated, and Firebase is configured
      if (!isFirebaseConfigured || !app || !isAuthenticated || permission !== 'granted' || !token) {
        console.log('Cannot schedule notification: not authenticated, no permission, or Firebase not configured');
        return null;
      }

      const endTime = Date.now() + durationMs;

      try {
        const functions = getFunctions(app);
        const scheduleTimer = httpsCallable<
          { fcmToken: string; endTime: number; type: string },
          ScheduleResponse
        >(functions, 'scheduleTimerNotification');

        const result = await scheduleTimer({
          fcmToken: token,
          endTime,
          type,
        });

        activeTimerRef.current = result.data.timerId;
        console.log('Scheduled notification:', result.data.timerId);
        return result.data.timerId;
      } catch (error) {
        console.error('Failed to schedule notification:', error);
        return null;
      }
    },
    [isAuthenticated, permission, token]
  );

  const cancelNotification = useCallback(async () => {
    if (!activeTimerRef.current || !isFirebaseConfigured || !app) return;

    try {
      const functions = getFunctions(app);
      const cancelTimer = httpsCallable<{ timerId: string }, { success: boolean }>(
        functions,
        'cancelTimerNotification'
      );

      await cancelTimer({ timerId: activeTimerRef.current });
      console.log('Cancelled notification:', activeTimerRef.current);
      activeTimerRef.current = null;
    } catch (error) {
      console.error('Failed to cancel notification:', error);
    }
  }, []);

  const ensurePermission = useCallback(async () => {
    if (permission === 'granted' && token) {
      return true;
    }
    const newToken = await requestPermission();
    return !!newToken;
  }, [permission, token, requestPermission]);

  return {
    scheduleNotification,
    cancelNotification,
    ensurePermission,
    hasPermission: permission === 'granted',
    supported,
    isFirebaseConfigured,
  };
}
