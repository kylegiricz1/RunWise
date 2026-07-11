import { StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {

  const weather = {
    recommendation: '7:00 PM',
    temperature: '72°F',
    feelsLike: '70°F',
    condition: 'Partly Cloudy',
    wind: '5 mph',
    humidity: '48%',
    rainChance: '10%',
  };

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Good Afternoon 👋</Text>

      <Text style={styles.heading}>Best Time to Run</Text>

      <View style={styles.mainCard}>
        <Text style={styles.time}>{weather.recommendation}</Text>
        <Text style={styles.subtitle}>
          Cool temperatures and low wind
        </Text>
      </View>

      <View style={styles.weatherCard}>
        <Text style={styles.cardTitle}>Current Weather</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Temperature</Text>
          <Text style={styles.value}>{weather.temperature}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Feels Like</Text>
          <Text style={styles.value}>{weather.feelsLike}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Conditions</Text>
          <Text style={styles.value}>{weather.condition}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Wind</Text>
          <Text style={styles.value}>{weather.wind}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Humidity</Text>
          <Text style={styles.value}>{weather.humidity}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Rain Chance</Text>
          <Text style={styles.value}>{weather.rainChance}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fb',
    padding: 24,
    paddingTop: 70,
  },

  greeting: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },

  heading: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 25,
  },

  mainCard: {
    backgroundColor: '#3B82F6',
    borderRadius: 20,
    paddingVertical: 35,
    alignItems: 'center',
    marginBottom: 25,
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

  weatherCard: {
    backgroundColor: 'white',
    borderRadius: 18,
    padding: 20,
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