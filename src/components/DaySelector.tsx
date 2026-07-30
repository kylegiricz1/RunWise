import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getShortDateLabel } from '../utils/date';

type Props = {
  dates: string[]; // "YYYY-MM-DD" per day, in order
  selectedIndex: number;
  onSelect: (index: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
};

export default function DaySelector({
  dates,
  selectedIndex,
  onSelect,
  onPrevious,
  onNext,
  canGoPrevious,
  canGoNext,
}: Props) {
  if (dates.length === 0) return null;

  return (
    <View style={styles.container}>
      <Pressable
        onPress={onPrevious}
        disabled={!canGoPrevious}
        style={[styles.arrowButton, !canGoPrevious && styles.arrowButtonDisabled]}
      >
        <Text style={[styles.arrowText, !canGoPrevious && styles.arrowTextDisabled]}>‹</Text>
      </Pressable>

      <View style={styles.daysRow}>
        {dates.map((date, index) => {
          const { weekday, day } = getShortDateLabel(date);
          const active = index === selectedIndex;
          return (
            <Pressable
              key={date}
              onPress={() => onSelect(index)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipWeekday, active && styles.chipTextActive]}>
                {weekday}
              </Text>
              <Text style={[styles.chipDay, active && styles.chipTextActive]}>{day}</Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={onNext}
        disabled={!canGoNext}
        style={[styles.arrowButton, !canGoNext && styles.arrowButtonDisabled]}
      >
        <Text style={[styles.arrowText, !canGoNext && styles.arrowTextDisabled]}>›</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  arrowButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },

  arrowButtonDisabled: {
    opacity: 0.35,
  },

  arrowText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#3B82F6',
    marginTop: -2,
  },

  arrowTextDisabled: {
    color: '#9AA3B2',
  },

  daysRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },

  chip: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 7,
    alignItems: 'center',
  },

  chipActive: {
    backgroundColor: '#3B82F6',
  },

  chipWeekday: {
    fontSize: 9,
    color: '#9AA3B2',
    fontWeight: '600',
  },

  chipDay: {
    fontSize: 15,
    color: '#333',
    fontWeight: '700',
    marginTop: 2,
  },

  chipTextActive: {
    color: 'white',
  },
});
