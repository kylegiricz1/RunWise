import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import HourStepper, { formatHourLabel } from '../../components/HourStepper';
import { PRESET_ORDER, PRESET_WINDOWS } from '../../constants/presetWindows';
import { useRunPreferences } from '../../context/RunPreferencesContext';

export default function PreferencesScreen() {
  const { preferences, togglePreset, addCustomWindow, removeCustomWindow } =
    useRunPreferences();

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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Preferences</Text>

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

      <Text style={styles.sectionTitle}>Custom windows</Text>

      {preferences.customWindows.length === 0 && !builderOpen && (
        <Text style={styles.sectionSubtitle}>
          Add a specific window if the presets don't quite fit your schedule.
        </Text>
      )}

      {preferences.customWindows.map((window) => (
        <View key={window.id} style={styles.customRow}>
          <Text style={styles.customLabel}>{window.label}</Text>
          <Pressable onPress={() => removeCustomWindow(window.id)} style={styles.removeButton}>
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
              onChange={(h) => {
                setCustomStart(h);
                setCustomError(null);
              }}
            />
            <HourStepper
              label="End"
              hour={customEnd}
              onChange={(h) => {
                setCustomEnd(h);
                setCustomError(null);
              }}
            />
          </View>

          {customError && <Text style={styles.errorText}>{customError}</Text>}

          <View style={styles.builderActions}>
            <Pressable
              onPress={() => {
                setBuilderOpen(false);
                setCustomError(null);
              }}
              style={[styles.builderButton, styles.builderButtonSecondary]}
            >
              <Text style={styles.builderButtonSecondaryText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleAddCustomWindow}
              style={[styles.builderButton, styles.builderButtonPrimary]}
            >
              <Text style={styles.builderButtonPrimaryText}>Add window</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable onPress={() => setBuilderOpen(true)} style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Add custom time window</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fb',
  },

  content: {
    padding: 24,
    paddingTop: 70,
    paddingBottom: 60,
  },

  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 6,
  },

  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 14,
    lineHeight: 19,
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