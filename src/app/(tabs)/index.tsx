import { ScrollView, StyleSheet, Text } from 'react-native';
import BestTimeCard from '../../components/BestTimeCard';
import DaySelector from '../../components/DaySelector';
import WeatherDetailsCard from '../../components/WeatherDetailsCard';
import WeatherGraphCard from '../../components/WeatherGraphCard';
import { useWeatherData } from '../../hooks/useWeatherData';
import { getDayLabel } from '../../utils/date';

export default function HomeScreen() {
  const {
    city,
    state,
    weather,
    hourlyData,
    bestTime,
    days,
    selectedDayIndex,
    selectDay,
    goToPreviousDay,
    goToNextDay,
    canGoPreviousDay,
    canGoNextDay,
  } = useWeatherData();

  const dayLabel =
    days.length > 0 ? getDayLabel(selectedDayIndex, days[selectedDayIndex].date) : '';

  return (
    <ScrollView style={styles.container}>
      
      <Text style={styles.greeting}>Good Afternoon</Text>

      <BestTimeCard city={city} state={state} bestTime={bestTime} dayLabel={dayLabel} />

      <DaySelector
        dates={days.map((d) => d.date)}
        selectedIndex={selectedDayIndex}
        onSelect={selectDay}
        onPrevious={goToPreviousDay}
        onNext={goToNextDay}
        canGoPrevious={canGoPreviousDay}
        canGoNext={canGoNextDay}
      />
      
      <WeatherGraphCard data={hourlyData} bestTime={bestTime} />

      <WeatherDetailsCard weather={weather} dayLabel={dayLabel} />
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