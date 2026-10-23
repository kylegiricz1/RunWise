export type GeocodingResult = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  feature_code?: string;
  country_code?: string;
  country?: string;
  admin1?: string; // e.g. State / Province (e.g., "Wisconsin")
  admin2?: string; // e.g. County
  timezone?: string;
  population?: number;
};

export type GeocodingResponse = {
  results?: GeocodingResult[];
  generationtime_ms?: number;
};

export async function searchLocations(
  query: string,
  count: number = 8
): Promise<GeocodingResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    trimmed
  )}&count=${count}&language=en&format=json`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Geocoding search failed with status ${response.status}`);
  }

  const data: GeocodingResponse = await response.json();
  return data.results ?? [];
}

export function formatLocationSubtitle(result: GeocodingResult): string {
  const parts = [result.admin1, result.country].filter(Boolean);
  return parts.join(', ');
}
