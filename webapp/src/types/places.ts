export type Category = 'walk' | 'food' | 'bar' | 'culture' | 'fun';

export const CATEGORY_LABELS: Record<Category, string> = {
  walk: 'Прогулка',
  food: 'Поесть',
  bar: 'Бары',
  culture: 'Музеи и выставки',
  fun: 'Развлечения',
};

export interface Place {
  id: string;
  name: string;
  category: Category;
  /** Название ближайшей станции метро (см. data/metro.ts). */
  metro: string;
  address: string;
  lat: number;
  lon: number;
  indoor: boolean;
  /** 1 = недорого, 3 = дорого */
  price: 1 | 2 | 3;
  /** Для компании какого размера место комфортно. */
  maxGroup: number;
  blurb: string;
}

/** То, что выбирает пользователь на экране фильтров. */
export interface Query {
  /** Пусто = любые категории. */
  categories: Category[];
  people: number;
  /** Станция, от которой считаем расстояние. null = не ограничиваем. */
  station: string | null;
  radiusKm: number;
}

/** Query + результат учёта погоды. Именно это уходит в API. */
export interface PlaceFilters extends Query {
  indoorOnly: boolean;
}

export interface PlaceResult extends Place {
  /** Расстояние по прямой от выбранной станции. null, если станция не выбрана. */
  distanceKm: number | null;
}
