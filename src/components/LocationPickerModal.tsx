import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocation } from '../context/LocationContext';
import {
  formatLocationSubtitle,
  GeocodingResult,
  searchLocations,
} from '../services/geocoding';

type Props = {
  visible: boolean;
  onClose: () => void;
};

const POPULAR_CITIES = [
  { name: 'Chicago', admin1: 'Illinois', country: 'United States', latitude: 41.85, longitude: -87.65 },
  { name: 'New York', admin1: 'New York', country: 'United States', latitude: 40.71, longitude: -74.01 },
  { name: 'Austin', admin1: 'Texas', country: 'United States', latitude: 30.27, longitude: -97.74 },
  { name: 'Denver', admin1: 'Colorado', country: 'United States', latitude: 39.74, longitude: -104.98 },
  { name: 'Seattle', admin1: 'Washington', country: 'United States', latitude: 47.61, longitude: -122.33 },
  { name: 'London', admin1: 'England', country: 'United Kingdom', latitude: 51.51, longitude: -0.13 },
];

export default function LocationPickerModal({ visible, onClose }: Props) {
  const { location, useGpsLocation, setManualLocation } = useLocation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [locatingGps, setLocatingGps] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Debounced search when query changes
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearching(true);
        setErrorMsg(null);
        const data = await searchLocations(query);
        setResults(data);
      } catch (err) {
        console.log('Geocoding error:', err);
        setErrorMsg('Failed to search locations. Please try again.');
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  const handleUseGps = async () => {
    try {
      setLocatingGps(true);
      setErrorMsg(null);
      await useGpsLocation();
      onClose();
    } catch (err) {
      setErrorMsg('Could not fetch GPS position.');
    } finally {
      setLocatingGps(false);
    }
  };

  const handleSelectCity = async (city: {
    latitude: number;
    longitude: number;
    name: string;
    admin1?: string;
    country?: string;
  }) => {
    try {
      await setManualLocation(
        city.latitude,
        city.longitude,
        city.name,
        city.admin1,
        city.country
      );
      setQuery('');
      setResults([]);
      onClose();
    } catch (err) {
      setErrorMsg('Failed to set location.');
    }
  };

  const currentLocationLabel = [location?.label, location?.region].filter(Boolean).join(', ');

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Choose Location</Text>
          <Pressable onPress={onClose} hitSlop={12} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#475569" />
          </Pressable>
        </View>

        {/* Current Location Badge */}
        {location ? (
          <View style={styles.currentLocationRow}>
            <View style={styles.currentLocationLeft}>
              <Ionicons
                name={location.source === 'gps' ? 'navigate-circle' : 'location'}
                size={20}
                color="#3B82F6"
              />
              <Text style={styles.currentLocationText}>
                Active: <Text style={styles.currentLocationBold}>{currentLocationLabel}</Text>
              </Text>
            </View>
            <View
              style={[
                styles.sourceBadge,
                location.source === 'gps' ? styles.gpsBadge : styles.manualBadge,
              ]}
            >
              <Text
                style={[
                  styles.sourceBadgeText,
                  location.source === 'gps' ? styles.gpsBadgeText : styles.manualBadgeText,
                ]}
              >
                {location.source === 'gps' ? 'GPS' : 'Manual'}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Use Current GPS Button */}
        <Pressable
          style={({ pressed }) => [styles.gpsButton, pressed && styles.gpsButtonPressed]}
          onPress={handleUseGps}
          disabled={locatingGps}
        >
          {locatingGps ? (
            <ActivityIndicator size="small" color="#3B82F6" />
          ) : (
            <Ionicons name="navigate" size={18} color="#3B82F6" />
          )}
          <Text style={styles.gpsButtonText}>
            {locatingGps ? 'Finding your GPS position…' : 'Use Current GPS Location'}
          </Text>
        </Pressable>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#94A3B8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search city, state, or country…"
            placeholderTextColor="#94A3B8"
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            autoCapitalize="words"
            returnKeyType="search"
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8} style={styles.clearButton}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </Pressable>
          ) : null}
        </View>

        {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

        {/* Results / Suggestions List */}
        {searching ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="small" color="#3B82F6" />
            <Text style={styles.searchingText}>Searching cities…</Text>
          </View>
        ) : query.trim().length >= 2 && results.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.noResultsText}>No locations found for "{query}".</Text>
            <Text style={styles.noResultsSub}>Try typing a different city or region name.</Text>
          </View>
        ) : query.trim().length >= 2 ? (
          <FlatList
            data={results}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [styles.resultRow, pressed && styles.resultRowPressed]}
                onPress={() => handleSelectCity(item)}
              >
                <Ionicons name="location-outline" size={20} color="#64748B" />
                <View style={styles.resultTextCol}>
                  <Text style={styles.resultName}>{item.name}</Text>
                  <Text style={styles.resultSubtitle}>{formatLocationSubtitle(item)}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
              </Pressable>
            )}
          />
        ) : (
          <View style={styles.popularSection}>
            <Text style={styles.popularHeading}>Popular Cities</Text>
            <FlatList
              data={POPULAR_CITIES}
              keyExtractor={(item) => item.name}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }) => [styles.resultRow, pressed && styles.resultRowPressed]}
                  onPress={() => handleSelectCity(item)}
                >
                  <Ionicons name="business-outline" size={18} color="#64748B" />
                  <View style={styles.resultTextCol}>
                    <Text style={styles.resultName}>{item.name}</Text>
                    <Text style={styles.resultSubtitle}>
                      {[item.admin1, item.country].filter(Boolean).join(', ')}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                </Pressable>
              )}
            />
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  closeButton: {
    padding: 4,
  },
  currentLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFF6FF',
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  currentLocationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  currentLocationText: {
    fontSize: 13,
    color: '#1E40AF',
    flexShrink: 1,
  },
  currentLocationBold: {
    fontWeight: '700',
  },
  sourceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  gpsBadge: {
    backgroundColor: '#BFDBFE',
  },
  manualBadge: {
    backgroundColor: '#E2E8F0',
  },
  sourceBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  gpsBadgeText: {
    color: '#1D4ED8',
  },
  manualBadgeText: {
    color: '#475569',
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 14,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  gpsButtonPressed: {
    backgroundColor: '#F1F5F9',
  },
  gpsButtonText: {
    color: '#2563EB',
    fontWeight: '600',
    fontSize: 14,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    marginHorizontal: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    padding: 0,
  },
  clearButton: {
    padding: 4,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginHorizontal: 20,
    marginBottom: 8,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  searchingText: {
    color: '#64748B',
    fontSize: 14,
  },
  noResultsText: {
    color: '#334155',
    fontWeight: '600',
    fontSize: 15,
  },
  noResultsSub: {
    color: '#94A3B8',
    fontSize: 13,
  },
  listContent: {
    paddingHorizontal: 20,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  resultRowPressed: {
    backgroundColor: '#F1F5F9',
  },
  resultTextCol: {
    flex: 1,
    marginLeft: 12,
  },
  resultName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  resultSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  popularSection: {
    flex: 1,
  },
  popularHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginHorizontal: 20,
    marginBottom: 10,
    marginTop: 6,
  },
});
