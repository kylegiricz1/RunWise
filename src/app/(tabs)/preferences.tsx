import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import HourStepper, { formatHourLabel } from '../../components/HourStepper';
import LocationPickerModal from '../../components/LocationPickerModal';
import { PRESET_ORDER, PRESET_WINDOWS } from '../../constants/presetWindows';
import { useLocation } from '../../context/LocationContext';
import { useRunPreferences } from '../../context/RunPreferencesContext';
import { isNotificationsSupported, sendTestNotification } from '../../services/notifications';

export default function PreferencesScreen() {
  const {
    preferences,
    togglePreset,
    addCustomWindow,
    removeCustomWindow,
    setNotificationsEnabled,
    setNotificationHour,
  } = useRunPreferences();
  const { location } = useLocation();

  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [customStart, setCustomStart] = useState(6);
  const [customEnd, setCustomEnd] = useState(8);
  const [customError, setCustomError] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<string | null>(null);

  const notificationsEnabled = preferences.notifications?.enabled ?? false;
  const alertHour = preferences.notifications?.hour ?? 20;
  const supported = isNotificationsSupported();

  const handleToggleNotifications = async (val: boolean) => {
    if (!supported && val) {
      Alert.alert(
        'Development Build Required',
        'Android notifications were removed from Expo Go in SDK 53+. Please create a development build (npx expo run:android) to enable and test notifications on your device.',
        [{ text: 'OK' }]
      );
      return;
    }

    const success = await setNotificationsEnabled(val);
    if (val && !success) {
      Alert.alert(
        'Permission Required',
        'Notification permissions are required to receive nightly run recommendations. Please enable notifications in your device settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
    }
  };

  const handleSendTestNotification = async () => {
    if (!supported) {
      Alert.alert(
        'Development Build Required',
        'Android notifications were removed from Expo Go in SDK 53+. Please create a development build (npx expo run:android) to test notifications on your device.',
        [{ text: 'OK' }]
      );
      return;
    }
    setTestStatus('Sending test notification...');
    const result = await sendTestNotification();
    if (result) {
      setTestStatus('Notification scheduled! Check your device in 2s.');
    } else {
      setTestStatus('Could not send notification. Please grant permissions.');
    }
    setTimeout(() => setTestStatus(null), 4000);
  };

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

      {/* Daily Run Notifications Section */}
      <Text style={styles.sectionTitle}>Daily Run Notifications</Text>
      <Text style={styles.sectionSubtitle}>
        Get a nightly recommendation for the best time to run tomorrow based on upcoming weather and your preferred windows.
      </Text>

      <View style={styles.notificationCard}>
        <View style={styles.notificationToggleRow}>
          <View style={styles.notificationIconCol}>
            <Ionicons name="notifications-outline" size={24} color="#3B82F6" />
            <View style={styles.notificationLabelCol}>
              <Text style={styles.notificationTitle}>Nightly Run Forecast</Text>
              <Text style={styles.notificationSubtitle}>
                {notificationsEnabled
                  ? `Fires every night at ${formatHourLabel(alertHour)}`
                  : 'Receive tomorrow\'s top run recommendation'}
              </Text>
            </View>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleToggleNotifications}
            trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
            thumbColor={notificationsEnabled ? '#3B82F6' : '#F8FAFC'}
          />
        </View>

        {!supported && (
          <View style={styles.devBuildWarning}>
            <Ionicons name="information-circle-outline" size={18} color="#D97706" />
            <Text style={styles.devBuildWarningText}>
              Notifications require a Development Build on Android (not supported in Expo Go). Run <Text style={styles.codeText}>npx expo run:android</Text> to test.
            </Text>
          </View>
        )}

        {notificationsEnabled && (
          <View style={styles.notificationConfigArea}>
            <View style={styles.cardDivider} />

            <View style={styles.timeStepperWrapper}>
              <HourStepper
                label="Notification Time"
                hour={alertHour}
                onChange={setNotificationHour}
                min={0}
                max={23.5}
              />
            </View>

            <View style={styles.previewBox}>
              <View style={styles.previewHeaderRow}>
                <Ionicons name="phone-portrait-outline" size={14} color="#64748B" />
                <Text style={styles.previewHeader}>Notification Preview</Text>
              </View>
              <Text style={styles.previewTitle}>Tomorrow's Best Run Time: 7:00 AM 🏃</Text>
              <Text style={styles.previewBody}>
                62°F · Fair · 0% rain chance. Tap to view details.
              </Text>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.testNotifButton,
                pressed && styles.testNotifButtonPressed,
              ]}
              onPress={handleSendTestNotification}
            >
              <Ionicons name="paper-plane-outline" size={16} color="#3B82F6" />
              <Text style={styles.testNotifButtonText}>Send Test Notification</Text>
            </Pressable>

            {testStatus ? <Text style={styles.testStatusText}>{testStatus}</Text> : null}
          </View>
        )}
      </View>

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
    color: '#3B82F6',
  },

  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },

  chip: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minWidth: '30%',
    flexGrow: 1,
  },

  chipActive: {
    backgroundColor: '#208AEF',
    borderColor: '#208AEF',
  },

  chipLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },

  chipLabelActive: {
    color: 'white',
  },

  chipSubLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 3,
  },

  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },

  customLabel: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500',
  },

  removeButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },

  removeButtonText: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '500',
  },

  addButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
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

  notificationCard: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 4,
    marginBottom: 20,
  },

  notificationToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  notificationIconCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 12,
  },

  notificationLabelCol: {
    flex: 1,
  },

  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },

  notificationSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },

  notificationConfigArea: {
    marginTop: 14,
  },

  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 16,
  },

  timeStepperWrapper: {
    alignItems: 'center',
    marginBottom: 16,
  },

  previewBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },

  previewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },

  previewHeader: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  previewTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 2,
  },

  previewBody: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },

  testNotifButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },

  testNotifButtonPressed: {
    backgroundColor: '#DBEAFE',
  },

  testNotifButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B82F6',
  },

  testStatusText: {
    fontSize: 12,
    color: '#059669',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },

  devBuildWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },

  devBuildWarningText: {
    fontSize: 12,
    color: '#92400E',
    flex: 1,
    lineHeight: 16,
  },

  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '600',
  },
});
