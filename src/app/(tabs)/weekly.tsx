import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text } from 'react-native';
import WeeklyBestTimesChart from '../../components/weekly-best-times-chart';
import { useWeatherData } from '../../hooks/useWeatherData';

export default function WeeklyScreen() {
  const router = useRouter();
  const { dailyBestTimes, loading } = useWeatherData();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
    >
      <Text style={styles.heading}>Your week at a glance</Text>
      <Text style={styles.description}>
        Find the strongest run window for every day, based on your preferred schedule.
      </Text>

      {loading ? (
        <Text style={styles.loading}>Building your weekly plan…</Text>
      ) : (
        <WeeklyBestTimesChart
          data={dailyBestTimes}
          onSelectDay={(index) =>
            router.navigate({ pathname: '/', params: { day: String(index) } })
          }
        />
      )}
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
    gap: 16,
  },
  heading: {
    color: '#172033',
    fontSize: 28,
    fontWeight: '700',
  },
  description: {
    color: '#64748B',
    fontSize: 15,
    lineHeight: 21,
  },
  loading: {
    color: '#64748B',
    fontSize: 15,
  },
});
