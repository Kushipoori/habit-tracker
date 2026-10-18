import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { Habit } from './types';

const CHANNEL_ID = 'habit-reminders';

// Show reminders even when the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function ensureChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Habit reminders',
    importance: Notifications.AndroidImportance.HIGH,
  });
}

export async function hasPermission(): Promise<boolean> {
  const { granted } = await Notifications.getPermissionsAsync();
  return granted;
}

/** Asks for notification permission if needed. Returns whether reminders can be shown. */
export async function requestPermission(): Promise<boolean> {
  // Android 13+ only shows the permission prompt once a channel exists.
  await ensureChannel();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const result = await Notifications.requestPermissionsAsync();
  return result.granted;
}

function bodyFor(h: Habit): string {
  if (h.schedule.kind === 'perWeek') return `Aim: ${h.schedule.times}× this week. Tap to check in.`;
  return 'Time to check this off today.';
}

/** Cancels every scheduled reminder and schedules them again from the current habits. */
async function resync(habits: Habit[]): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!(await hasPermission())) return;
  await ensureChannel();

  for (const h of habits) {
    if (!h.remind || !h.time) continue;
    const content = { title: h.name, body: bodyFor(h), data: { habitId: h.id } };
    const { hour, minute } = h.time;

    if (h.schedule.kind === 'weekdays') {
      for (const day of h.schedule.days) {
        await Notifications.scheduleNotificationAsync({
          content,
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday: day + 1, // expo: 1 = Sunday … 7 = Saturday
            hour,
            minute,
            channelId: CHANNEL_ID,
          },
        });
      }
    } else {
      await Notifications.scheduleNotificationAsync({
        content,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
          channelId: CHANNEL_ID,
        },
      });
    }
  }
}

// Run syncs one after another so two quick edits can't interleave.
let queue: Promise<void> = Promise.resolve();

export function syncReminders(habits: Habit[]): Promise<void> {
  queue = queue
    .then(() => resync(habits))
    .catch((e) => console.warn('Could not schedule reminders', e));
  return queue;
}
