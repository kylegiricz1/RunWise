import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';
import { TimeWindow } from '../../types/settings';
import { DayForecast } from '../../types/weather';
import { formatTimeLabel } from '../../utils/time';
import { bestRunHour } from '../weatherScoring/score';
import { filterHoursByWindows } from '../weatherScoring/timeWindowFilter';

export const RUNWISE_NOTIFICATION_CHANNEL_ID = 'runwise-daily-best-time';
export const NOTIFICATION_PREFIX = 'runwise-daily-day-';

/**
 * Check if the current runtime environment supports expo-notifications.
 * Note: Remote/push notifications were removed from Expo Go on Android in SDK 53+,
 * so importing expo-notifications inside Android Expo Go throws an Uncaught Error.
 * In a development build or production build, this returns true.
 */
export function isNotificationsSupported(): boolean {
  if (Platform.OS === 'web') return false;
  if (Platform.OS === 'android' && isRunningInExpoGo()) {
    return false;
  }
  return true;
}

/**
 * Lazily loads expo-notifications only if supported in the current environment.
 */
function getNotificationsModule(): any | null {
  if (!isNotificationsSupported()) {
    return null;
  }
  try {
    return require('expo-notifications');
  } catch (error) {
    console.warn('Failed to load expo-notifications:', error);
    return null;
  }
}

// Initialize foreground notification presentation handler if supported
if (isNotificationsSupported()) {
  try {
    const Notifications = getNotificationsModule();
    if (Notifications?.setNotificationHandler) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
    }
  } catch (e) {
    console.warn('Could not initialize notification handler:', e);
  }
}

/**
 * Configure Android notification channels. Required for Android 8.0+ (API 26+).
 */
export async function setupNotificationChannels(): Promise<void> {
  const Notifications = getNotificationsModule();
  if (!Notifications || Platform.OS !== 'android') return;

  try {
    await Notifications.setNotificationChannelAsync(RUNWISE_NOTIFICATION_CHANNEL_ID, {
      name: 'Daily Run Recommendations',
      description: 'Nightly notifications recommending the optimal time to run tomorrow',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#208AEF',
    });
  } catch (error) {
    console.warn('Failed to set up notification channel:', error);
  }
}

/**
 * Check if the user has granted notification permissions.
 */
export async function checkNotificationPermissions(): Promise<boolean> {
  const Notifications = getNotificationsModule();
  if (!Notifications) return false;

  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === Notifications.PermissionStatus.GRANTED;
  } catch {
    return false;
  }
}

/**
 * Prompt user for notification permissions and set up notification channels.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  const Notifications = getNotificationsModule();
  if (!Notifications) return false;

  try {
    await setupNotificationChannels();
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== Notifications.PermissionStatus.GRANTED) {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: false,
          allowSound: true,
        },
      });
      finalStatus = status;
    }

    return finalStatus === Notifications.PermissionStatus.GRANTED;
  } catch (error) {
    console.warn('Failed to request notification permissions:', error);
    return false;
  }
}

/**
 * Cancel all previously scheduled RunWise daily notifications.
 */
export async function cancelDailyNotifications(): Promise<void> {
  const Notifications = getNotificationsModule();
  if (!Notifications) return;

  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of scheduled) {
      if (notif.identifier && notif.identifier.startsWith(NOTIFICATION_PREFIX)) {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }
  } catch (error) {
    console.warn('Failed to cancel scheduled notifications:', error);
  }
}

/**
 * Send an immediate test notification (in 2 seconds) to verify permissions and layout.
 */
export async function sendTestNotification(): Promise<string | null> {
  const Notifications = getNotificationsModule();
  if (!Notifications) return null;

  const granted = await requestNotificationPermissions();
  if (!granted) return null;

  try {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: "Tomorrow's Best Run Time: 7:00 AM 🏃",
        body: '62°F feels like 60°F · Low humidity · 0% rain. Great morning conditions!',
        sound: 'default',
        data: {
          dayIndex: 1,
          url: '/(tabs)?day=1',
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 2,
        channelId: RUNWISE_NOTIFICATION_CHANNEL_ID,
      },
    });
  } catch (error) {
    console.warn('Failed to schedule test notification:', error);
    return null;
  }
}

/**
 * Schedules a rolling series of nightly notifications (for the next 1-5 days)
 * calculated from the user's weather forecast and preferred run windows.
 *
 * Each notification for Day i fires on the evening of Day i-1 at `alertHour`.
 */
export async function scheduleRollingRunNotifications(
  days: DayForecast[],
  activeWindows: TimeWindow[],
  alertHour: number = 20
): Promise<number> {
  const Notifications = getNotificationsModule();
  if (!Notifications || !days || days.length <= 1) return 0;

  const granted = await checkNotificationPermissions();
  if (!granted) return 0;

  await setupNotificationChannels();
  await cancelDailyNotifications();

  let scheduledCount = 0;
  const now = Date.now();
  const maxDays = Math.min(days.length, 6);

  for (let i = 1; i < maxDays; i++) {
    const targetDay = days[i];
    const triggerDay = days[i - 1]; // Notify the evening before
    if (!targetDay || !triggerDay) continue;

    // Build the trigger date (triggerDay at alertHour)
    const [tYear, tMonth, tDay] = triggerDay.date.split('-').map(Number);
    const hour = Math.floor(alertHour);
    const minute = alertHour % 1 === 0.5 ? 30 : 0;
    const triggerDate = new Date(tYear, tMonth - 1, tDay, hour, minute, 0, 0);

    // Only schedule if the trigger is in the future (+ 30s buffer)
    if (triggerDate.getTime() <= now + 30 * 1000) {
      continue;
    }

    if (!targetDay.hourly || targetDay.hourly.length === 0) continue;

    const filteredHours = filterHoursByWindows(targetDay.hourly, activeWindows);
    const bestHour = bestRunHour(filteredHours);
    if (!bestHour || !bestHour.time) continue;

    const timePart = bestHour.time.split('T')[1];
    const formattedTime = formatTimeLabel(timePart) ?? timePart;
    const feelsLike = Math.round(bestHour.feelsLike);
    const rainChance = Math.round(bestHour.rainChance);
    const condition = targetDay.weather?.condition ?? 'Fair';

    const dayName =
      i === 1
        ? 'Tomorrow'
        : new Date(targetDay.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long' });

    try {
      await Notifications.scheduleNotificationAsync({
        identifier: `${NOTIFICATION_PREFIX}${i}`,
        content: {
          title: `${dayName}'s Best Run Time: ${formattedTime} 🏃`,
          body: `${feelsLike}°F · ${condition} · ${rainChance}% rain chance. Tap to view details.`,
          sound: 'default',
          data: {
            dayIndex: i,
            url: `/(tabs)?day=${i}`,
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
          channelId: RUNWISE_NOTIFICATION_CHANNEL_ID,
        },
      });
      scheduledCount++;
    } catch (err) {
      console.warn(`Failed to schedule notification for day ${i}:`, err);
    }
  }

  return scheduledCount;
}

/**
 * Registers listeners for notification responses (user tapping a notification).
 * Safe to call in all environments including Expo Go.
 */
export function subscribeToNotificationResponses(
  onResponse: (dayIndex: number | string) => void
): () => void {
  const Notifications = getNotificationsModule();
  if (!Notifications?.addNotificationResponseReceivedListener) {
    return () => {};
  }

  try {
    const responseSub = Notifications.addNotificationResponseReceivedListener((response: any) => {
      const dayIndex = response?.notification?.request?.content?.data?.dayIndex;
      if (dayIndex !== undefined && dayIndex !== null) {
        onResponse(dayIndex);
      }
    });

    if (Notifications.getLastNotificationResponseAsync) {
      Notifications.getLastNotificationResponseAsync()
        .then((response: any) => {
          if (response) {
            const dayIndex = response?.notification?.request?.content?.data?.dayIndex;
            if (dayIndex !== undefined && dayIndex !== null) {
              onResponse(dayIndex);
            }
          }
        })
        .catch(() => {});
    }

    return () => {
      responseSub?.remove?.();
    };
  } catch (error) {
    console.warn('Failed to subscribe to notification responses:', error);
    return () => {};
  }
}
