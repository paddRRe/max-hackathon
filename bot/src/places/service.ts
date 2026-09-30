import { PLACES, STATIONS } from './data';
import type { PlaceResult, PlacesQuery } from './types';

// Чистые функции без Express: фильтры, карточка, кнопки. Легко тестировать.

/** Русские подписи категорий для карточек в чате. */
export const CATEGORY_LABELS_RU: Record<string, string> = {
  cafe: 'Кафе',
  restaurant: 'Ресторан',
  bar: 'Бар',
  coworking: 'Коворкинг',
  park: 'Парк',
  museum: 'Музей',
  cinema: 'Кино',
  sport: 'Спорт',
  karaoke: 'Караоке',
  quest: 'Квест',
};

export function haversineKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
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

function toMinutes(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

/** Открыто ли место прямо сейчас по строке openHours. Не разобрали — считаем открытым. */
export function isOpenNow(openHours: string | undefined, now = new Date()): boolean {
  if (!openHours) return true;
  const lower = openHours.toLowerCase();
  if (lower.includes('круглосуточно')) return true;
  const parts = openHours.split(/[–—-]/).map((s) => s.trim());
  if (parts.length !== 2) return true;
  const from = toMinutes(parts[0]);
  const to = toMinutes(parts[1]);
  if (from === null || to === null) return true;
  const cur = now.getHours() * 60 + now.getMinutes();
  if (from <= to) return cur >= from && cur < to;
  return cur >= from || cur < to; // через полночь, например 18:00–06:00
}

/** Отфильтровать места по запросу GET /api/places. Бросает ошибку на неизвестной станции. */
export function filterPlaces(query: PlacesQuery, now = new Date()): PlaceResult[] {
  const wanted = (query.categories ?? '')
    .split(',')
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean);

  let origin: { lat: number; lon: number } | undefined;
  if (query.station) {
    const found = STATIONS[query.station];
    if (!found) throw new Error(`неизвестная станция: ${query.station}`);
    origin = found;
  }

  const list = PLACES.filter((p) => {
    if (wanted.length > 0 && !p.categories.some((c) => wanted.includes(c))) return false;
    if (query.people !== undefined && p.capacity < query.people) return false;
    if (query.indoorOnly && !p.indoor) return false;
    if (query.priceMax !== undefined && (p.priceLevel ?? 0) > query.priceMax) return false;
    if (query.district !== undefined && p.district !== query.district) return false;
    if (query.openNow && !isOpenNow(p.openHours, now)) return false;
    if (origin && query.radiusKm !== undefined) {
      if (haversineKm(origin.lat, origin.lon, p.lat, p.lon) > query.radiusKm) return false;
    }
    return true;
  });

  switch (query.sort) {
    case 'rating':
      return [...list].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    case 'price':
      return [...list].sort((a, b) => (a.priceLevel ?? 99) - (b.priceLevel ?? 99));
    case 'name':
      return [...list].sort((a, b) => a.name.localeCompare(b.name, 'ru'));
    default:
      return list;
  }
}

export function findPlace(placeId: string): PlaceResult | undefined {
  return PLACES.find((p) => p.id === placeId);
}

function priceSigns(level?: number): string {
  return level ? '₽'.repeat(level) : 'цена неизвестна';
}

/** Текст карточки, которую бот шлёт в чат. */
export function renderCard(place: PlaceResult): string {
  const cats = place.categories.map((c) => CATEGORY_LABELS_RU[c] ?? c).join(', ');
  const lines = [
    `📍 ${place.name}`,
    `${cats} · ${priceSigns(place.priceLevel)}${place.district ? ` · ${place.district}` : ''}`,
    `${place.address} (м. ${place.station})`,
  ];
  if (place.openHours) lines.push(`Часы: ${place.openHours}`);
  lines.push('', place.description);
  if (place.mapLinks?.yandex) lines.push(`🗺 ${place.mapLinks.yandex}`);
  return lines.join('\n');
}

export interface CardButtons {
  /** payload для кнопки «Голосую»: vote:<pollId>:<placeId>. Без него кнопка не добавляется. */
  votePayload?: string;
}

/** Клавиатура карточки: кнопка голосования + ссылка на карту. */
export function cardAttachments(place: PlaceResult, buttons: CardButtons = {}): Record<string, unknown>[] {
  const row: Record<string, unknown>[] = [];
  if (buttons.votePayload) {
    row.push({ type: 'callback', text: 'Голосую за это место', payload: buttons.votePayload });
  }
  const mapUrl = place.mapLinks?.yandex ?? `https://yandex.ru/maps/?pt=${place.lon},${place.lat}&z=16&l=map`;
  return [
    {
      type: 'inline_keyboard',
      payload: { buttons: [[...row, { type: 'link', text: 'Открыть на карте', url: mapUrl }]] },
    },
  ];
}

/** Текст итогов голосования. */
export function renderPollResults(
  options: { placeName: string; votes: number }[],
  winnerName: string | null,
): string {
  const lines = options.map((o) => `• ${o.placeName} — ${o.votes}`);
  if (winnerName) lines.push('', `🏆 Побеждает: ${winnerName}`);
  else lines.push('', 'Голосов не было — решайте сами 🙂');
  return ['Голосование завершено:', ...lines].join('\n');
}
