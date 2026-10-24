import { router, Stack } from 'expo-router';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LocationProvider } from '../context/LocationContext';
import { RunPreferencesProvider } from '../context/RunPreferencesContext';
import { subscribeToNotificationResponses } from '../services/notifications';

export default function RootLayout() {
  useEffect(() => {
    // Safely subscribes to notification taps (handles both cold starts and foreground/background events)
    const unsubscribe = subscribeToNotificationResponses((dayIndex) => {
      router.push({
        pathname: '/(tabs)',
        params: { day: String(dayIndex) },
      });
    });

    return () => {
      unsubscribe();
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
