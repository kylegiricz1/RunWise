import { StyleSheet, Text, View } from 'react-native';
import BestTimeCard from '../../components/BestTimeCard';
import DaySelector from '../../components/DaySelector';
import WeatherGraphCard from '../../components/WeatherGraphCard';
import { useWeatherData } from '../../hooks/useWeatherData';
import { getDayLabel } from '../../utils/date';

export default function HomeScreen() {
  const {
    city,
    state,
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
    <View style={styles.container}>
      <BestTimeCard city={city} state={state} bestTime={bestTime} dayLabel={dayLabel} />

      <View style={styles.daySection}>
        <Text style={styles.sectionLabel}>Choose a run day</Text>
        <DaySelector
          dates={days.map((d) => d.date)}
          selectedIndex={selectedDayIndex}
          onSelect={selectDay}
          onPrevious={goToPreviousDay}
          onNext={goToNextDay}
          canGoPrevious={canGoPreviousDay}
          canGoNext={canGoNextDay}
        />
      </View>
      
      <WeatherGraphCard data={hourlyData} bestTime={bestTime} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fb',
    padding: 24,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 14,
  },

  daySection: {
    gap: 8,
  },

  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
  },
});
