export type LocationSource = 'gps' | 'manual';

export interface LocationState {
  source: LocationSource;
  latitude: number;
  longitude: number;
  label: string; // "Current Location" or the selected city name
  region?: string; // e.g. "WI" or state/province
  country?: string; // e.g. "United States"
}
