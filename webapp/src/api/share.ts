import type { PlaceResult } from '../types/places';
import { routeUrl } from '../utils/geo';

const API_URL = import.meta.env.VITE_API_URL as string | undefined;

export type ShareStatus = 'sent' | 'copied' | 'failed';

export function shareText(place: PlaceResult): string {
  return `${place.name}, м. ${place.metro}\n${place.address}\n${routeUrl(place.lat, place.lon)}`;
}

// Предложить место в чат.
//
// Контракт для бэкенда (бот отправит карточку с кнопками голосования):
//   POST {API}/api/suggest  { placeId, chatId, initData }  → 200
// Пока бэкенда нет, копируем описание места в буфер обмена.
export async function suggestToChat(place: PlaceResult): Promise<ShareStatus> {
  const bridge = window.WebApp;

  if (API_URL) {
    try {
      const res = await fetch(`${API_URL}/api/suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placeId: place.id,
          chatId: bridge?.initDataUnsafe?.chat?.id ?? null,
          initData: bridge?.initData ?? '',
        }),
      });
      return res.ok ? 'sent' : 'failed';
    } catch {
      return 'failed';
    }
  }

  try {
    await navigator.clipboard.writeText(shareText(place));
    return 'copied';
  } catch {
    return 'failed';
  }
}
