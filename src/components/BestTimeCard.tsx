import { StyleSheet, Text, View } from 'react-native';

type Props = {
  city: string | null;
  state: string | null;
  bestTime: string | null;
};

export default function BestTimeCard({ city, state, bestTime }: Props) {
  return (
    <>
      <Text style={styles.heading}>
        Best Time to Run {city && `in ${city}, ${state}`}
      </Text>

      <View style={styles.mainCard}>
        <Text style={styles.time}> {bestTime}</Text>
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
    paddingVertical: 35,
    alignItems: 'center',
    marginBottom: 10,
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