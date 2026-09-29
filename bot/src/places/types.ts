// Shared contract of the places data layer.
// IMPORTANT: keep in sync with webapp/src/types/places.ts.

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
}

export interface SuggestRequest {
  placeId: string;
  /** Target chat/dialog id the bot will send the card to. */
  chatId: number;
  /** MAX Bridge initData of the user (reserved for validation, see TODO). */
  initData?: string;
}
