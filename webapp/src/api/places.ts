import { STATION_BY_NAME } from '../data/metro';
import { PLACES } from '../data/places';
import type { PlaceFilters, PlaceResult } from '../types/places';
import { distanceKm } from '../utils/geo';

// Если задан VITE_API_URL, ходим на бэкенд, иначе работаем на демо-данных.
//
// Контракт для бэкенда:
//   GET {API}/api/places?categories=walk,food&people=4&station=Октябрьская&radiusKm=3&indoorOnly=1
//   → PlaceResult[] (см. types/places.ts), уже отфильтровано и отсортировано.
const API_URL = import.meta.env.VITE_API_URL as string | undefined;

export async function fetchPlaces(filters: PlaceFilters): Promise<PlaceResult[]> {
  if (API_URL) {
    const qs = new URLSearchParams({
      people: String(filters.people),
      radiusKm: String(filters.radiusKm),
      indoorOnly: filters.indoorOnly ? '1' : '0',
    });
    if (filters.categories.length) qs.set('categories', filters.categories.join(','));
    if (filters.station) qs.set('station', filters.station);
    const res = await fetch(`${API_URL}/api/places?${qs}`);
    if (!res.ok) throw new Error(`GET /api/places: ${res.status}`);
    return (await res.json()) as PlaceResult[];
  }

  await new Promise((resolve) => setTimeout(resolve, 150));
  return filterDemo(filters);
}

function filterDemo(filters: PlaceFilters): PlaceResult[] {
  const station = filters.station ? STATION_BY_NAME.get(filters.station) : undefined;

  const results: PlaceResult[] = PLACES.filter(
    (p) =>
      (filters.categories.length === 0 || filters.categories.includes(p.category)) &&
      p.maxGroup >= filters.people &&
      (!filters.indoorOnly || p.indoor),
  ).map((p) => ({
    ...p,
    distanceKm: station ? distanceKm(station.lat, station.lon, p.lat, p.lon) : null,
  }));

  if (!station) return results.sort((a, b) => a.name.localeCompare(b.name, 'ru'));

  return results
    .filter((p) => (p.distanceKm ?? Infinity) <= filters.radiusKm)
    .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
}
