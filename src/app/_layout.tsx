import * as Notifications from 'expo-notifications';
import { router, Stack } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LocationProvider } from '../context/LocationContext';
import { RunPreferencesProvider } from '../context/RunPreferencesContext';

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS === 'web') return;

    // Handle notification click when app is in foreground / background
    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const dayIndex = response.notification.request.content.data?.dayIndex;
      if (dayIndex !== undefined && dayIndex !== null) {
        router.push({
          pathname: '/(tabs)',
          params: { day: String(dayIndex) },
        });
      }
    });

    // Handle notification click when app is cold launched
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        const dayIndex = response.notification.request.content.data?.dayIndex;
        if (dayIndex !== undefined && dayIndex !== null) {
          router.push({
            pathname: '/(tabs)',
            params: { day: String(dayIndex) },
          });
        }
      }
    });

    return () => {
      responseSub.remove();
    };
  }, []);

  return (
    <LocationProvider>
      <RunPreferencesProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <Stack screenOptions={{ headerShown: false }} />
        </GestureHandlerRootView>
      </RunPreferencesProvider>
    </LocationProvider>
  );
}
