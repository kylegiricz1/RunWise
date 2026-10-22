import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { LocationState } from '../types/location';

const STORAGE_KEY = 'runwise:selectedLocation';

type LocationContextValue = {
  location: LocationState | null;
  loading: boolean;
  error: string | null;
  useGpsLocation: () => Promise<void>;
  setManualLocation: (
    latitude: number,
    longitude: number,
    label: string,
    region?: string,
    country?: string
  ) => Promise<void>;
};

const LocationContext = createContext<LocationContextValue | null>(null);

export function LocationProvider({ children }: { children: React.ReactNode }) {
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
      let country: string | undefined;
      try {
        const address = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (address.length > 0) {
          if (address[0].city) label = address[0].city;
          region = address[0].region ?? undefined;
          country = address[0].country ?? undefined;
        }
      } catch (geocodeError) {
        console.log('Reverse geocode error:', geocodeError);
      }

      await persist({ source: 'gps', latitude, longitude, label, region, country });
    } catch (err) {
      console.log('GPS location error:', err);
      setError(err instanceof Error ? err.message : 'Failed to get location');
    } finally {
      setLoading(false);
    }
  }, [persist]);

  const setManualLocation = useCallback(
    async (
      latitude: number,
      longitude: number,
      label: string,
      region?: string,
      country?: string
    ) => {
      setError(null);
      await persist({ source: 'manual', latitude, longitude, label, region, country });
    },
    [persist]
  );

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
  }, [useGpsLocation]);

  const value: LocationContextValue = {
    location,
    loading,
    error,
    useGpsLocation,
    setManualLocation,
  };

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocation(): LocationContextValue {
  const ctx = useContext(LocationContext);
  if (!ctx) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return ctx;
}
