export interface Weather {
  tempC: number;
  precipMm: number;
  /** Дождь/снег или мороз: лучше идти в помещение. */
  isBad: boolean;
}

// Open-Meteo: бесплатно, без ключа. Координаты центра Москвы.
const WEATHER_URL =
  'https://api.open-meteo.com/v1/forecast?latitude=55.75&longitude=37.62' +
  '&current=temperature_2m,precipitation&timezone=Europe%2FMoscow';

export async function fetchMoscowWeather(signal?: AbortSignal): Promise<Weather | null> {
  try {
    const res = await fetch(WEATHER_URL, { signal });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      current?: { temperature_2m?: number; precipitation?: number };
    };
    const tempC = data.current?.temperature_2m;
    const precipMm = data.current?.precipitation;
    if (typeof tempC !== 'number' || typeof precipMm !== 'number') return null;
    return { tempC, precipMm, isBad: precipMm > 0.2 || tempC < 0 };
  } catch {
    return null;
  }
}
