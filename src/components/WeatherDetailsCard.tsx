import { StyleSheet, Text, View } from 'react-native';
import { WeatherData } from '../types/weather';

type Props = {
  weather: WeatherData | null;
};

const ROWS: { label: string; key: keyof WeatherData }[] = [
  { label: 'Temperature', key: 'temperature' },
  { label: 'Feels Like', key: 'feelsLike' },
  { label: 'Conditions', key: 'condition' },
  { label: 'Wind', key: 'wind' },
  { label: 'Humidity', key: 'humidity' },
  { label: 'Rain Chance', key: 'rainChance' },
];

export default function WeatherDetailsCard({ weather }: Props) {
  return (
    <View style={styles.weatherCard}>
      <Text style={styles.cardTitle}>Tomorrow's Weather</Text>

      {ROWS.map(({ label, key }) => (
        <View key={key} style={styles.row}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.value}>{weather?.[key] ?? '—'}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  weatherCard: {
    backgroundColor: 'white',
    borderRadius: 18,
    padding: 20,
    marginBottom: 100,
  },

  cardTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 18,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },

  label: {
    fontSize: 16,
    color: '#666',
  },

  value: {
    fontSize: 16,
    fontWeight: '600',
  },
});