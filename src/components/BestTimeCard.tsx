import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LocationSource } from '../types/location';
import { formatTimeLabel } from '../utils/time';

type Props = {
  city: string | null;
  state: string | null;
  bestTime: string | null;
  dayLabel: string; // e.g. "Today", "Tomorrow", "Thursday"
  source?: LocationSource;
  onPressLocation?: () => void;
};

export default function BestTimeCard({
  city,
  state,
  bestTime,
  dayLabel,
  source,
  onPressLocation,
}: Props) {
  const locationLabel = [city, state].filter(Boolean).join(', ') || 'Choose location';

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Your best run window</Text>
        {onPressLocation ? (
          <Pressable
            style={({ pressed }) => [styles.locationPill, pressed && styles.locationPillPressed]}
            onPress={onPressLocation}
            hitSlop={6}
          >
            <Ionicons
              name={source === 'gps' ? 'navigate-circle' : 'location-sharp'}
              size={14}
              color="#3B82F6"
            />
            <Text style={styles.locationText} numberOfLines={1}>
              {locationLabel}
            </Text>
            <Ionicons name="chevron-down" size={12} color="#64748B" />
          </Pressable>
        ) : locationLabel ? (
          <Text style={styles.locationText}>{locationLabel}</Text>
        ) : null}
      </View>

      <View style={styles.mainCard}>
        <Text style={styles.dayLabel}>{dayLabel}</Text>
        <Text style={styles.time}>{formatTimeLabel(bestTime) ?? '—'}</Text>
        <Text style={styles.subtitle}>Cool temperatures and low wind</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#172033',
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    maxWidth: '55%',
  },
  locationPillPressed: {
    backgroundColor: '#F1F5F9',
  },
  locationText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
  mainCard: {
    backgroundColor: '#3B82F6',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 13,
    marginTop: 4,
  },
  dayLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  time: {
    color: 'white',
    fontSize: 36,
    fontWeight: 'bold',
  },
  subtitle: {
    color: 'white',
    fontSize: 13,
    marginTop: 2,
    fontWeight: '600',
  },
});
