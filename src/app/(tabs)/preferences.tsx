import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import HourStepper, { formatHourLabel } from '../../components/HourStepper';
import LocationPickerModal from '../../components/LocationPickerModal';
import { PRESET_ORDER, PRESET_WINDOWS } from '../../constants/presetWindows';
import { useLocation } from '../../context/LocationContext';
import { useRunPreferences } from '../../context/RunPreferencesContext';

export default function PreferencesScreen() {
  const { preferences, togglePreset, addCustomWindow, removeCustomWindow } =
    useRunPreferences();
  const { location } = useLocation();

  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [customStart, setCustomStart] = useState(6);
  const [customEnd, setCustomEnd] = useState(8);
  const [customError, setCustomError] = useState<string | null>(null);

  const handleAddCustomWindow = () => {
    if (customEnd <= customStart) {
      setCustomError('End time must be after start time.');
      return;
    }
    setCustomError(null);
    addCustomWindow({
      label: `${formatHourLabel(customStart)} – ${formatHourLabel(customEnd)}`,
      startHour: customStart,
      endHour: customEnd,
    });
    setBuilderOpen(false);
    setCustomStart(6);
    setCustomEnd(8);
  };

  const locationLabel =
    [location?.label, location?.region].filter(Boolean).join(', ') || 'Not selected';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Preferences</Text>

      {/* Location Section */}
      <Text style={styles.sectionTitle}>Running Location</Text>
      <Text style={styles.sectionSubtitle}>
        Weather forecasts and optimal run windows are calculated for this location.
      </Text>

      <View style={styles.locationCard}>
        <View style={styles.locationInfoRow}>
          <Ionicons
            name={location?.source === 'gps' ? 'navigate-circle' : 'location'}
            size={22}
            color="#3B82F6"
          />
          <View style={styles.locationTextCol}>
            <Text style={styles.locationName}>{locationLabel}</Text>
            <Text style={styles.locationSourceText}>
              {location?.source === 'gps' ? 'Auto-detected via GPS' : 'Custom selected city'}
            </Text>
          </View>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.changeLocationButton,
            pressed && styles.changeLocationButtonPressed,
          ]}
          onPress={() => setLocationModalOpen(true)}
        >
          <Text style={styles.changeLocationButtonText}>Change</Text>
        </Pressable>
      </View>

      {/* Schedule / Preset Section */}
      <Text style={styles.sectionTitle}>When do you usually run?</Text>
      <Text style={styles.sectionSubtitle}>
        We'll only recommend times inside the windows you pick below. Leave everything
        unselected to consider the whole day.
      </Text>

      <View style={styles.chipRow}>
        {PRESET_ORDER.map((key) => {
          const preset = PRESET_WINDOWS[key];
          const active = preferences.selectedPresets.includes(key);
          return (
            <Pressable
              key={key}
              onPress={() => togglePreset(key)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                {preset.label}
              </Text>
              <Text style={[styles.chipSubLabel, active && styles.chipLabelActive]}>
                {formatHourLabel(preset.startHour)} – {formatHourLabel(preset.endHour)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Custom Windows */}
      <Text style={styles.sectionTitle}>Custom Windows</Text>
      <Text style={styles.sectionSubtitle}>
        Have a specific block of free time? Add your own windows below.
      </Text>

      {preferences.customWindows.map((window) => (
        <View key={window.id} style={styles.customRow}>
          <Text style={styles.customLabel}>{window.label}</Text>
          <Pressable
            onPress={() => removeCustomWindow(window.id)}
            style={styles.removeButton}
            hitSlop={8}
          >
            <Text style={styles.removeButtonText}>Remove</Text>
          </Pressable>
        </View>
      ))}

      {builderOpen ? (
        <View style={styles.builderCard}>
          <View style={styles.stepperRow}>
            <HourStepper
              label="Start"
              hour={customStart}
              onChange={(next) => {
                setCustomStart(next);
                setCustomError(null);
              }}
            />
            <HourStepper
              label="End"
              hour={customEnd}
              onChange={(next) => {
                setCustomEnd(next);
                setCustomError(null);
              }}
            />
          </View>

          {customError ? <Text style={styles.errorText}>{customError}</Text> : null}

          <View style={styles.builderActions}>
            <Pressable
              style={[styles.builderButton, styles.builderButtonSecondary]}
              onPress={() => {
                setBuilderOpen(false);
                setCustomError(null);
              }}
            >
              <Text style={styles.builderButtonSecondaryText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.builderButton, styles.builderButtonPrimary]}
              onPress={handleAddCustomWindow}
            >
              <Text style={styles.builderButtonPrimaryText}>Save Window</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable style={styles.addButton} onPress={() => setBuilderOpen(true)}>
          <Text style={styles.addButtonText}>+ Add Custom Window</Text>
        </Pressable>
      )}

      <LocationPickerModal
        visible={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },

  content: {
    padding: 24,
    paddingBottom: 48,
  },

  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#0F172A',
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 22,
    marginBottom: 6,
    color: '#1E293B',
  },

  sectionSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 14,
    lineHeight: 19,
  },

  locationCard: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },

  locationInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },

  locationTextCol: {
    flex: 1,
  },

  locationName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },

  locationSourceText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },

  changeLocationButton: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },

  changeLocationButtonPressed: {
    backgroundColor: '#DBEAFE',
  },

  changeLocationButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },

  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  chip: {
    backgroundColor: 'white',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: '#E5E9F0',
    minWidth: '30%',
  },

  chipActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },

  chipLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },

  chipSubLabel: {
    fontSize: 11,
    color: '#9AA3B2',
    marginTop: 2,
  },

  chipLabelActive: {
    color: 'white',
  },

  customRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },

  customLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },

  removeButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },

  removeButtonText: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '600',
  },

  addButton: {
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },

  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },

  builderCard: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 18,
    marginTop: 4,
  },

  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },

  errorText: {
    fontSize: 12,
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 10,
  },

  builderActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 10,
  },

  builderButton: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },

  builderButtonSecondary: {
    backgroundColor: '#F2F4F7',
  },

  builderButtonSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },

  builderButtonPrimary: {
    backgroundColor: '#3B82F6',
  },

  builderButtonPrimaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
});
