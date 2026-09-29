import { PLACES, STATIONS } from './data';
import type { PlaceResult, PlacesQuery } from './types';

function haversineKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) *
      Math.cos((bLat * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** Filter places by the GET /api/places query. Throws on unknown station. */
export function filterPlaces(query: PlacesQuery): PlaceResult[] {
  const wanted = (query.categories ?? '')
    .split(',')
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean);

  let origin: { lat: number; lon: number } | undefined;
  if (query.station) {
    const found = STATIONS[query.station];
    if (!found) throw new Error(`unknown station: ${query.station}`);
    origin = found;
  }

  return PLACES.filter((p) => {
    if (wanted.length > 0 && !p.categories.some((c) => wanted.includes(c))) return false;
    if (query.people !== undefined && p.capacity < query.people) return false;
    if (query.indoorOnly && !p.indoor) return false;
    if (origin && query.radiusKm !== undefined) {
      if (haversineKm(origin.lat, origin.lon, p.lat, p.lon) > query.radiusKm) return false;
    }
    return true;
  });
}

export function findPlace(placeId: string): PlaceResult | undefined {
  return PLACES.find((p) => p.id === placeId);
}

/** Human-readable card text the bot sends to the chat on POST /api/suggest. */
export function renderCard(place: PlaceResult): string {
  const lines = [
    `📍 ${place.name}`,
    place.address,
    `Метро: ${place.station} · до ${place.capacity} чел. · ${place.indoor ? 'в помещении' : 'на улице'}`,
  ];
  if (place.openHours) lines.push(`Часы: ${place.openHours}`);
  lines.push('', place.description);
  return lines.join('\n');
}

/** Inline keyboard with a map link attached to the suggestion card. */
export function cardAttachments(place: PlaceResult): Record<string, unknown>[] {
  return [
    {
      type: 'inline_keyboard',
      payload: {
        buttons: [
          [
            {
              type: 'link',
              text: 'Открыть на карте',
              url: `https://yandex.ru/maps/?pt=${place.lon},${place.lat}&z=16&l=map`,
            },
          ],
        ],
      },
    },
  ];
}
