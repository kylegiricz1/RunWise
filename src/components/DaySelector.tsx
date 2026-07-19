import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
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
      </ScrollView>

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
    marginBottom: 14,
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

  chipRow: {
    paddingHorizontal: 8,
    gap: 8,
  },

  chip: {
    backgroundColor: 'white',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
    minWidth: 52,
  },

  chipActive: {
    backgroundColor: '#3B82F6',
  },

  chipWeekday: {
    fontSize: 11,
    color: '#9AA3B2',
    fontWeight: '600',
  },

  chipDay: {
    fontSize: 16,
    color: '#333',
    fontWeight: '700',
    marginTop: 2,
  },

  chipTextActive: {
    color: 'white',
  },
});