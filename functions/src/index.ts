import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

interface ScheduledTimer {
  userId: string;
  fcmToken: string;
  endTime: admin.firestore.Timestamp;
  type: 'focus' | 'shortBreak' | 'longBreak';
  notificationSent: boolean;
}

/**
 * Schedule a timer notification
 * Called from the client when a timer starts
 */
export const scheduleTimerNotification = functions.https.onCall(
  async (data: { fcmToken: string; endTime: number; type: string }, context) => {
    // Verify user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be signed in');
    }

    const { fcmToken, endTime, type } = data;

    // Store the scheduled timer
    const timerRef = await db.collection('scheduledTimers').add({
      userId: context.auth.uid,
      fcmToken,
      endTime: admin.firestore.Timestamp.fromMillis(endTime),
      type,
      notificationSent: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { timerId: timerRef.id };
  }
);

/**
 * Cancel a scheduled timer notification
 */
export const cancelTimerNotification = functions.https.onCall(
  async (data: { timerId: string }, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be signed in');
    }

    const { timerId } = data;
    const timerDoc = await db.collection('scheduledTimers').doc(timerId).get();

    if (!timerDoc.exists) {
      return { success: true }; // Already deleted
    }

    const timer = timerDoc.data() as ScheduledTimer;
    if (timer.userId !== context.auth.uid) {
      throw new functions.https.HttpsError('permission-denied', 'Not your timer');
    }

    await timerDoc.ref.delete();
    return { success: true };
  }
);

/**
 * Cloud Scheduler function that runs every minute
 * Checks for timers that have ended and sends notifications
 */
export const checkTimers = functions.pubsub
  .schedule('every 1 minutes')
  .onRun(async () => {
    const now = admin.firestore.Timestamp.now();

    // Find all timers that have ended and haven't been notified
    const expiredTimers = await db
      .collection('scheduledTimers')
      .where('endTime', '<=', now)
      .where('notificationSent', '==', false)
      .get();

    const notifications: Promise<void>[] = [];

    expiredTimers.forEach((doc) => {
      const timer = doc.data() as ScheduledTimer;

      const title =
        timer.type === 'focus' ? '🍅 Focus time complete!' : '☕ Break time over!';
      const body =
        timer.type === 'focus'
          ? 'Great work! Time for a break.'
          : 'Ready to focus again?';

      // Send the notification
      const sendNotification = messaging
        .send({
          token: timer.fcmToken,
          notification: {
            title,
            body,
          },
          webpush: {
            notification: {
              icon: '/pomodoro/icons/icon-192.png',
              badge: '/pomodoro/icons/icon-192.png',
              vibrate: [200, 100, 200],
              requireInteraction: true,
            },
            fcmOptions: {
              link: '/pomodoro/',
            },
          },
        })
        .then(async () => {
          // Mark as sent and delete
          await doc.ref.delete();
        })
        .catch(async (error) => {
          console.error('Error sending notification:', error);
          // If token is invalid, delete the timer
          if (
            error.code === 'messaging/invalid-registration-token' ||
            error.code === 'messaging/registration-token-not-registered'
          ) {
            await doc.ref.delete();
          } else {
            // Mark as sent to prevent retries
            await doc.ref.update({ notificationSent: true });
          }
        });

      notifications.push(sendNotification);
    });

    await Promise.all(notifications);
    console.log(`Processed ${notifications.length} timer notifications`);
  });
