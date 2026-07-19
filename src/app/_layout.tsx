import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RunPreferencesProvider } from '../context/RunPreferencesContext';

export default function RootLayout() {
  return (
    <RunPreferencesProvider>
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
    </GestureHandlerRootView>
    </RunPreferencesProvider>
  );
}