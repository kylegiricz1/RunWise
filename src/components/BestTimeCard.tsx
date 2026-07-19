import { StyleSheet, Text, View } from 'react-native';
import { formatTimeLabel } from '../utils/time';

type Props = {
  city: string | null;
  state: string | null;
  bestTime: string | null;
  dayLabel: string; // e.g. "Today", "Tomorrow", "Thursday"
};

export default function BestTimeCard({ city, state, bestTime, dayLabel }: Props) {
  return (
    <>
      <Text style={styles.heading}>
        Best Time to Run {city && `in ${city}, ${state}`}
      </Text>

      <View style={styles.mainCard}>
        <Text style={styles.dayLabel}>{dayLabel}</Text>
        <Text style={styles.time}> {formatTimeLabel(bestTime) ?? '—'}</Text>
        <Text style={styles.subtitle}>Cool temperatures and low wind</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  mainCard: {
    backgroundColor: '#3B82F6',
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10,
  },

  dayLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  time: {
    color: 'white',
    fontSize: 46,
    fontWeight: 'bold',
  },

  subtitle: {
    color: 'white',
    fontSize: 16,
    marginTop: 8,
  },
});