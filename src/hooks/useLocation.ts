import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import { LocationState } from '../types/location';

const STORAGE_KEY = 'runwise:selectedLocation';

type UseLocationResult = {
  location: LocationState | null;
  loading: boolean;
  error: string | null;
  useGpsLocation: () => Promise<void>;
  setManualLocation: (latitude: number, longitude: number, label: string) => Promise<void>;
};

export function useLocation(): UseLocationResult {
  const [location, setLocation] = useState<LocationState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const persist = useCallback(async (next: LocationState) => {
    setLocation(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (storageError) {
      console.log('Failed to persist location:', storageError);
    }
  }, []);

  const useGpsLocation = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const { latitude, longitude } = currentLocation.coords;

      let label = 'Current Location';
      let region: string | undefined;
      try {
        const address = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (address.length > 0 && address[0].city) {
            label = address[0].city;
            region = address[0].region ?? undefined;
        }
        } catch (geocodeError) {
        console.log('Reverse geocode error:', geocodeError);
        }

    await persist({ source: 'gps', latitude, longitude, label, region });
    } catch (err) {
      console.log('GPS location error:', err);
      setError(err instanceof Error ? err.message : 'Failed to get location');
    } finally {
      setLoading(false);
    }
  }, [persist]);

  const setManualLocation = useCallback(
    async (latitude: number, longitude: number, label: string, region?: string) => {
        setError(null);
        await persist({ source: 'manual', latitude, longitude, label, region });
    },
    [persist]
    );

  // On mount: try to restore a saved location, otherwise fall back to GPS.
  useEffect(() => {
    async function init() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          setLocation(JSON.parse(saved) as LocationState);
          setLoading(false);
          return;
        }
      } catch (storageError) {
        console.log('Failed to read saved location:', storageError);
      }
      await useGpsLocation();
    }
    init();
  }, []);

  return { location, loading, error, useGpsLocation, setManualLocation };
}