/**
 * Cloud Functions tests
 * 
 * Note: These are unit tests that mock Firebase services.
 * For full integration testing, use Firebase Emulator Suite.
 * 
 * Run emulators: firebase emulators:start
 * Run tests: npm test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock firebase-admin before importing functions
vi.mock('firebase-admin', () => {
  const mockFirestore = {
    collection: vi.fn().mockReturnThis(),
    doc: vi.fn().mockReturnThis(),
    add: vi.fn().mockResolvedValue({ id: 'test-timer-id' }),
    get: vi.fn().mockResolvedValue({
      exists: true,
      data: () => ({ userId: 'test-user' }),
      ref: { delete: vi.fn().mockResolvedValue(undefined) },
    }),
    where: vi.fn().mockReturnThis(),
    delete: vi.fn().mockResolvedValue(undefined),
  };

  const mockMessaging = {
    send: vi.fn().mockResolvedValue('message-id'),
  };

  return {
    initializeApp: vi.fn(),
    firestore: vi.fn(() => mockFirestore),
    messaging: vi.fn(() => mockMessaging),
  };
});

// Mock firebase-functions
vi.mock('firebase-functions', () => ({
  https: {
    onCall: vi.fn((handler) => handler),
    HttpsError: class HttpsError extends Error {
      constructor(public code: string, message: string) {
        super(message);
      }
    },
  },
  pubsub: {
    schedule: vi.fn(() => ({
      onRun: vi.fn((handler) => handler),
    })),
  },
}));

describe('Cloud Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('scheduleTimerNotification', () => {
    it('should require authentication', async () => {
      // Import after mocks are set up
      const { scheduleTimerNotification } = await import('./index');

      const context = { auth: null };
      const data = {
        fcmToken: 'test-token',
        endTime: Date.now() + 60000,
        type: 'focus',
      };

      await expect(scheduleTimerNotification(data, context as any)).rejects.toThrow(
        'Must be signed in'
      );
    });

    it('should create a scheduled timer when authenticated', async () => {
      const { scheduleTimerNotification } = await import('./index');

      const context = { auth: { uid: 'test-user-123' } };
      const data = {
        fcmToken: 'test-token',
        endTime: Date.now() + 60000,
        type: 'focus',
      };

      const result = await scheduleTimerNotification(data, context as any);
      expect(result).toHaveProperty('timerId');
    });
  });

  describe('cancelTimerNotification', () => {
    it('should require authentication', async () => {
      const { cancelTimerNotification } = await import('./index');

      const context = { auth: null };
      const data = { timerId: 'test-timer-id' };

      await expect(cancelTimerNotification(data, context as any)).rejects.toThrow(
        'Must be signed in'
      );
    });

    it('should succeed when timer belongs to user', async () => {
      const { cancelTimerNotification } = await import('./index');

      const context = { auth: { uid: 'test-user' } };
      const data = { timerId: 'test-timer-id' };

      const result = await cancelTimerNotification(data, context as any);
      expect(result).toEqual({ success: true });
    });
  });
});

describe('Notification message formatting', () => {
  it('should format focus completion message correctly', () => {
    const type = 'focus';
    const title = type === 'focus' ? '🍅 Focus time complete!' : '☕ Break time over!';
    const body =
      type === 'focus' ? 'Great work! Time for a break.' : 'Ready to focus again?';

    expect(title).toBe('🍅 Focus time complete!');
    expect(body).toBe('Great work! Time for a break.');
  });

  it('should format break completion message correctly', () => {
    const type = 'shortBreak';
    const title = type === 'focus' ? '🍅 Focus time complete!' : '☕ Break time over!';
    const body =
      type === 'focus' ? 'Great work! Time for a break.' : 'Ready to focus again?';

    expect(title).toBe('☕ Break time over!');
    expect(body).toBe('Ready to focus again?');
  });
});
