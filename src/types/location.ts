type LocationSource = "gps" | "manual";

interface LocationState {
  source: LocationSource;
  latitude: number;
  longitude: number;
  label: string; // "Current Location" or "Whatever city you select"
}