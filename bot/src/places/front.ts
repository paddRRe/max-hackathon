import { STATIONS } from './data';
import { filterPlaces, haversineKm } from './service';
import type { PlaceCategory, PlaceResult } from './types';

// Слой под контракт фронта (webapp/src/types/places.ts).
// Внутренняя модель не меняется, здесь только перевод:
// категории walk|food|bar|culture|fun, русские станции, поля PlaceResult.
// Чистые функции — тестируются без Express.

/** Категория фронта → внутренние категории. */
const FRONT_TO_INTERNAL: Record<string, PlaceCategory[]> = {
  walk: ['park'],
  food: ['cafe', 'restaurant'],
  bar: ['bar'],
  culture: ['museum'],
  fun: ['cinema', 'karaoke', 'quest', 'sport'],
};

/** Внутренняя категория → категория фронта (когда запрос без категорий). */
const INTERNAL_TO_FRONT: Record<string, string> = {
  park: 'walk',
  cafe: 'food',
  restaurant: 'food',
  bar: 'bar',
  museum: 'culture',
  cinema: 'fun',
  karaoke: 'fun',
  quest: 'fun',
  sport: 'fun',
  // TODO(front): у фронта нет категории под коворкинги, пока отдаём как 'food'.
  coworking: 'food',
};

/** Латинский ключ станции → русское название для фронта. */
const STATION_RU: Record<string, string> = {
  Tverskaya: 'Тверская',
  Arbatskaya: 'Арбатская',
  'Kitay-gorod': 'Китай-город',
  'Park Kultury': 'Парк культуры',
  Belorusskaya: 'Белорусская',
  Novoslobodskaya: 'Новослободская',
  Taganskaya: 'Таганская',
  Paveletskaya: 'Павелецкая',
  Barrikadnaya: 'Баррикадная',
};

export interface FrontPlace {
  id: string;
  name: string;
  category: string;
  metro: string;
  address: string;
  lat: number;
  lon: number;
  indoor: boolean;
  price: number;
  maxGroup: number;
  blurb: string;
  distanceKm: number | null;
}

export interface FrontQuery {
  categories?: string;
  people?: number;
  station?: string;
  radiusKm?: number;
  indoorOnly?: boolean;
  priceMax?: number;
  district?: string;
  openNow?: boolean;
  sort?: 'rating' | 'price' | 'name';
}

function splitSlugs(raw: string | undefined): string[] {
  return (raw ?? '')
    .split(',')
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean);
}

function toFront(place: PlaceResult, wanted: string[], distanceKm: number | null): FrontPlace {
  const category =
    wanted.find((slug) => (FRONT_TO_INTERNAL[slug] ?? []).some((c) => place.categories.includes(c))) ??
    INTERNAL_TO_FRONT[place.categories[0]] ??
    'fun';
  return {
    id: place.id,
    name: place.name,
    category,
    metro: STATION_RU[place.station] ?? place.station,
    address: place.address,
    lat: place.lat,
    lon: place.lon,
    indoor: place.indoor,
    price: place.priceLevel ?? 1,
    maxGroup: place.capacity,
    blurb: place.description,
    distanceKm,
  };
}

/** Подборка в форме фронта. Бросает ошибку на неизвестной станции. */
export function frontPlaces(query: FrontQuery): FrontPlace[] {
  const wanted = splitSlugs(query.categories);
  const expanded = [...new Set(wanted.flatMap((slug) => FRONT_TO_INTERNAL[slug] ?? []))];

  const list = filterPlaces({
    categories: expanded.join(','),
    people: query.people,
    station: query.station,
    radiusKm: query.radiusKm,
    indoorOnly: query.indoorOnly,
    priceMax: query.priceMax,
    district: query.district,
    openNow: query.openNow,
    sort: query.sort,
  });

  const origin = query.station ? STATIONS[query.station] : undefined;
  const mapped = list.map((p) =>
    toFront(
      p,
      wanted,
      origin ? Math.round(haversineKm(origin.lat, origin.lon, p.lat, p.lon) * 10) / 10 : null,
    ),
  );

  if (query.sort) return mapped; // сортировка бэка уже применена в filterPlaces
  if (origin) return mapped.sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
  return mapped.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
}
