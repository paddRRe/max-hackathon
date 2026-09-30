// Контракт слоя мест: какие поля отдаёт /api/places.
// Старые поля не переименовываем и не удаляем — их ждёт текущий фронт.

/** Category slugs (UI labels live on the frontend). */
export type PlaceCategory =
  | 'cafe'
  | 'restaurant'
  | 'bar'
  | 'coworking'
  | 'park'
  | 'museum'
  | 'cinema'
  | 'sport'
  | 'karaoke'
  | 'quest';

export interface PlaceResult {
  id: string;
  name: string;
  description: string;
  categories: PlaceCategory[];
  address: string;
  /** Nearest metro station (key of STATIONS in ../places/data). */
  station: string;
  lat: number;
  lon: number;
  /** Max comfortable group size. */
  capacity: number;
  /** True when the place is indoors (relevant for bad weather). */
  indoor: boolean;
  priceLevel?: 1 | 2 | 3;
  openHours?: string;
  /** Район города, например «Тверской». */
  district?: string;
  /** Оценка места от 0 до 5 (для сортировки). */
  rating?: number;
  /** Ссылки на карты. */
  mapLinks?: { yandex?: string; gis?: string };
}

/** Filters accepted by GET /api/places (all optional). */
export interface PlacesQuery {
  /** Comma-separated category slugs, e.g. "cafe,coworking". */
  categories?: string;
  /** Needed group size; only places with capacity >= people match. */
  people?: number;
  /** Metro station name; combined with radiusKm. */
  station?: string;
  /** Radius in km around the station (requires station). */
  radiusKm?: number;
  /** When true, only indoor places match. */
  indoorOnly?: boolean;
  /** Max price level (places with priceLevel <= priceMax match). */
  priceMax?: number;
  /** City district, exact match. */
  district?: string;
  /** When true, only places open right now match. */
  openNow?: boolean;
  /** Sort results: rating (best first), price (cheapest first), name (A-Z). */
  sort?: 'rating' | 'price' | 'name';
}

export interface SuggestRequest {
  placeId: string;
  /** Target chat/dialog id the bot will send the card to. */
  chatId: number;
  /** MAX Bridge initData of the user (reserved for validation, see TODO). */
  initData?: string;
}

/** Body of POST /api/poll: start a vote for 2-3 places in a chat. */
export interface PollCreateRequest {
  chatId: number;
  placeIds: string[];
  /** How many people should vote; when all voted, the bot announces the winner. */
  expectedVoters?: number;
}
