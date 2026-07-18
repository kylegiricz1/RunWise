import { ScrollView, StyleSheet, Text } from 'react-native';
import BestTimeCard from '../../components/BestTimeCard';
import WeatherDetailsCard from '../../components/WeatherDetailsCard';
import WeatherGraphCard from '../../components/WeatherGraphCard';
import { useWeatherData } from '../../hooks/useWeatherData';

export default function HomeScreen() {
  const { city, state, weather, hourlyData, bestTime } = useWeatherData();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.greeting}>Good Afternoon</Text>

      <BestTimeCard city={city} state={state} bestTime={bestTime} />

      <WeatherGraphCard data={hourlyData} bestTime={bestTime} />

      <WeatherDetailsCard weather={weather} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fb',
    padding: 24,
    paddingTop: 70,
    paddingBottom: 150,
  },

  greeting: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
});