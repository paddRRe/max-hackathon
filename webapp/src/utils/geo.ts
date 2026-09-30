const R = 6371; // км

const rad = (deg: number) => (deg * Math.PI) / 180;

/** Расстояние по прямой между двумя точками, км. */
export function distanceKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const dLat = rad(bLat - aLat);
  const dLon = rad(bLon - aLon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Грубая оценка времени пешком: путь по городу ~1,3 от прямой, 5 км/ч. */
export function walkMinutes(km: number): number {
  return Math.max(1, Math.round(((km * 1.3) / 5) * 60));
}

export function formatKm(km: number): string {
  return km.toFixed(1).replace('.', ',');
}

/** Веб-ссылка на маршрут в Яндекс Картах (точка отправления: текущее положение). */
export function routeUrl(lat: number, lon: number): string {
  return `https://yandex.ru/maps/?rtext=~${lat},${lon}`;
}
