import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { TimeWindow } from '../../types/settings';
import { DayForecast } from '../../types/weather';
import { formatTimeLabel } from '../../utils/time';
import { bestRunHour } from '../weatherScoring/score';
import { filterHoursByWindows } from '../weatherScoring/timeWindowFilter';

export const RUNWISE_NOTIFICATION_CHANNEL_ID = 'runwise-daily-best-time';
export const NOTIFICATION_PREFIX = 'runwise-daily-day-';

// Configure foreground notification presentation handler.
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/**
 * Configure Android notification channels. Required for Android 8.0+ (API 26+).
 */
export async function setupNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;

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
  if (Platform.OS === 'web') return false;

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
  if (Platform.OS === 'web') return false;

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
  if (Platform.OS === 'web') return;

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
  if (Platform.OS === 'web') return null;

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
  if (Platform.OS === 'web' || !days || days.length <= 1) return 0;

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
