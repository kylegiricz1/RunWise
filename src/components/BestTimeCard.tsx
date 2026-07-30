import { StyleSheet, Text, View } from 'react-native';
import { formatTimeLabel } from '../utils/time';

type Props = {
  city: string | null;
  state: string | null;
  bestTime: string | null;
  dayLabel: string; // e.g. "Today", "Tomorrow", "Thursday"
};

export default function BestTimeCard({ city, state, bestTime, dayLabel }: Props) {
  const location = [city, state].filter(Boolean).join(', ');

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>
        Your best run window
      </Text>
      {location ? <Text style={styles.location}>{location}</Text> : null}

      <View style={styles.mainCard}>
        <Text style={styles.dayLabel}>{dayLabel}</Text>
        <Text style={styles.time}> {formatTimeLabel(bestTime) ?? '—'}</Text>
        <Text style={styles.subtitle}>Cool temperatures and low wind</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 2,
  },

  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#172033',
  },

  location: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
  },

  mainCard: {
    backgroundColor: '#3B82F6',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 13,
    marginTop: 6,
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
