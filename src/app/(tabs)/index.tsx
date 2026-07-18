import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import WeatherGraphCard from '../../components/WeatherGraphCard';
import { bestRunHour } from "../../services/weatherScoring/score";

export default function HomeScreen() {

  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [state, setState] = useState<string | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [hourlyData, setHourlyData] = useState<HourlyPoint[]>([]);
  const [bestTime, setBestTime] = useState<string| null>(null);

  useEffect(() => {
    async function getLocation() {
      try {
        const { status } =
          await Location.requestForegroundPermissionsAsync();

        if (status !== 'granted') {
          console.log('Permission denied');
          return;
        }

        const currentLocation =
          await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });

        setLocation(currentLocation.coords);

        // Reverse geocoding can fail/throw on some platforms (e.g. web) —
        // don't let it block the weather fetch below.
        try {
          const address = await Location.reverseGeocodeAsync({
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
          });

          if (address.length > 0) {
            setCity(address[0].city);
            setState(address[0].region);
          }
        } catch (geocodeError) {
          console.log('Reverse geocode error:', geocodeError);
        }

        const { latitude, longitude } = currentLocation.coords;
        const url =
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
          `&daily=temperature_2m_max,apparent_temperature_max,precipitation_probability_max,windspeed_10m_max,relative_humidity_2m_mean,weathercode` +
          `&hourly=apparent_temperature,relative_humidity_2m,precipitation_probability,windspeed_10m` +
          `&temperature_unit=fahrenheit&windspeed_unit=mph&timezone=auto`;

        const response = await fetch(url);
        const data = await response.json();

        const i = 1; // tomorrow: daily

        setWeather({
          temperature: `${Math.round(data.daily.temperature_2m_max[i])}°F`,
          feelsLike: `${Math.round(data.daily.apparent_temperature_max[i])}°F`,
          condition: getConditionText(data.daily.weathercode[i]),
          wind: `${Math.round(data.daily.windspeed_10m_max[i])} mph`,
          humidity: `${Math.round(data.daily.relative_humidity_2m_mean[i])}%`,
          rainChance: `${Math.round(data.daily.precipitation_probability_max[i])}%`,
        });

        // Hourly data for tomorrow: indices 24–47 (index 0 = midnight today)
        const hourly: HourlyPoint[] = [];
        for (let h = 24; h < 48; h++) {
          hourly.push({
            time: data.hourly.time[h],
            feelsLike: data.hourly.apparent_temperature[h],
            humidity: data.hourly.relative_humidity_2m[h],
            rainChance: data.hourly.precipitation_probability[h],
            wind: data.hourly.windspeed_10m[h],
          });
        }
        setHourlyData(hourly);

        const time = bestRunHour(hourly).time.split("T")[1];

        setBestTime(time);

      } catch (error) {
        console.log("Location error:", error);
      }
    }

    getLocation();
  }, []);

  type WeatherData = {
    temperature: string;
    feelsLike: string;
    condition: string;
    wind: string;
    humidity: string;
    rainChance: string;
  };

  type HourlyPoint = {
    time: string;
    feelsLike: number;
    humidity: number;
    rainChance: number;
    wind: number;
  };

  function getConditionText(code: number): string {
    const map: Record<number, string> = {
      0: 'Clear',
      1: 'Mostly Clear',
      2: 'Partly Cloudy',
      3: 'Overcast',
      45: 'Fog',
      48: 'Fog',
      51: 'Light Drizzle',
      53: 'Drizzle',
      55: 'Heavy Drizzle',
      61: 'Light Rain',
      63: 'Rain',
      65: 'Heavy Rain',
      71: 'Light Snow',
      73: 'Snow',
      75: 'Heavy Snow',
      80: 'Rain Showers',
      81: 'Rain Showers',
      82: 'Heavy Showers',
      95: 'Thunderstorm',
    };
    return map[code] ?? 'Unknown';
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.greeting}>Good Afternoon</Text>

      <Text style={styles.heading}>Best Time to Run {city && `in ${city}, ${state}`}</Text>

      <View style={styles.mainCard}>
        <Text style={styles.time}> {bestTime}</Text>
        <Text style={styles.subtitle}>
          Cool temperatures and low wind
        </Text>
      </View>

      <WeatherGraphCard data={hourlyData} />
      
      <View style={styles.weatherCard}>
        <Text style={styles.cardTitle}>Tomorrow's Weather</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Temperature</Text>
          <Text style={styles.value}>{weather?.temperature ?? '—'}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Feels Like</Text>
          <Text style={styles.value}>{weather?.feelsLike ?? '—'}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Conditions</Text>
          <Text style={styles.value}>{weather?.condition ?? '—'}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Wind</Text>
          <Text style={styles.value}>{weather?.wind ?? '—'}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Humidity</Text>
          <Text style={styles.value}>{weather?.humidity ?? '—'}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Rain Chance</Text>
          <Text style={styles.value}>{weather?.rainChance ?? '—'}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fb',
    padding: 24,
    paddingTop: 70,
    paddingBottom:150,
  },

  greeting: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },

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

  weatherCard: {
    backgroundColor: 'white',
    borderRadius: 18,
    padding: 20,
    marginBottom:100,
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