import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  label: string;
  hour: number; // 0–23.5 in 0.5 increments
  onChange: (hour: number) => void;
  min?: number;
  max?: number;
};

export function formatHourLabel(hour: number): string {
  const h = Math.floor(hour);
  const minutes = hour % 1 === 0.5 ? '30' : '00';
  const period = h >= 12 ? 'PM' : 'AM';
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${minutes} ${period}`;
}

export default function HourStepper({ label, hour, onChange, min = 0, max = 23.5 }: Props) {
  const step = (delta: number) => {
    const next = Math.min(max, Math.max(min, hour + delta));
    onChange(next);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.stepperRow}>
        <Pressable
          onPress={() => step(-0.5)}
          disabled={hour <= min}
          style={[styles.button, hour <= min && styles.buttonDisabled]}
        >
          <Text style={styles.buttonText}>−</Text>
        </Pressable>
        <Text style={styles.value}>{formatHourLabel(hour)}</Text>
        <Pressable
          onPress={() => step(0.5)}
          disabled={hour >= max}
          style={[styles.button, hour >= max && styles.buttonDisabled]}
        >
          <Text style={styles.buttonText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },

  label: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
  },

  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  button: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF1F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonDisabled: {
    opacity: 0.4,
  },

  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3B82F6',
  },

  value: {
    fontSize: 15,
    fontWeight: '600',
    marginHorizontal: 12,
    minWidth: 78,
    textAlign: 'center',
  },
});