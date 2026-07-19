import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { PRESET_WINDOWS } from '../constants/presetWindows';
import { PresetWindowKey, RunTimePreferences, TimeWindow } from '../types/settings';

const STORAGE_KEY = 'runwise:runTimePreferences';

const DEFAULT_PREFERENCES: RunTimePreferences = {
  selectedPresets: [],
  customWindows: [],
};

type RunPreferencesContextValue = {
  preferences: RunTimePreferences;
  loaded: boolean;
  togglePreset: (key: PresetWindowKey) => void;
  addCustomWindow: (window: Omit<TimeWindow, 'id'>) => void;
  removeCustomWindow: (id: string) => void;
  // All windows the person currently has selected, preset + custom combined.
  // Empty array means "no preference set" (i.e. don't filter anything).
  activeWindows: TimeWindow[];
};

const RunPreferencesContext = createContext<RunPreferencesContextValue | null>(null);

export function RunPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<RunTimePreferences>(DEFAULT_PREFERENCES);
  const [loaded, setLoaded] = useState(false);

  // Load persisted preferences on mount.
  useEffect(() => {
    async function load() {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          setPreferences(JSON.parse(raw));
        }
      } catch (err) {
        console.log('Failed to load run time preferences:', err);
      } finally {
        setLoaded(true);
      }
    }
    load();
  }, []);

  // Persist whenever preferences change (after initial load, to avoid
  // overwriting stored data with the default before it's read).
  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(preferences)).catch((err) =>
      console.log('Failed to save run time preferences:', err)
    );
  }, [preferences, loaded]);

  const togglePreset = (key: PresetWindowKey) => {
    setPreferences((prev) => {
      const isSelected = prev.selectedPresets.includes(key);
      return {
        ...prev,
        selectedPresets: isSelected
          ? prev.selectedPresets.filter((k) => k !== key)
          : [...prev.selectedPresets, key],
      };
    });
  };

  const addCustomWindow = (window: Omit<TimeWindow, 'id'>) => {
    const id = `custom-${Date.now()}`;
    setPreferences((prev) => ({
      ...prev,
      customWindows: [...prev.customWindows, { ...window, id }],
    }));
  };

  const removeCustomWindow = (id: string) => {
    setPreferences((prev) => ({
      ...prev,
      customWindows: prev.customWindows.filter((w) => w.id !== id),
    }));
  };

  const activeWindows = useMemo<TimeWindow[]>(() => {
    const presetWindows = preferences.selectedPresets.map((key) => PRESET_WINDOWS[key]);
    return [...presetWindows, ...preferences.customWindows];
  }, [preferences]);

  const value: RunPreferencesContextValue = {
    preferences,
    loaded,
    togglePreset,
    addCustomWindow,
    removeCustomWindow,
    activeWindows,
  };

  return (
    <RunPreferencesContext.Provider value={value}>{children}</RunPreferencesContext.Provider>
  );
}

export function useRunPreferences(): RunPreferencesContextValue {
  const ctx = useContext(RunPreferencesContext);
  if (!ctx) {
    throw new Error('useRunPreferences must be used within a RunPreferencesProvider');
  }
  return ctx;
}