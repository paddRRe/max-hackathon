export interface MetroLine {
  name: string;
  color: string;
}

export const LINES: Record<number, MetroLine> = {
  1: { name: 'Сокольническая', color: '#D6083B' },
  2: { name: 'Замоскворецкая', color: '#2DBE2C' },
  3: { name: 'Арбатско-Покровская', color: '#0078BE' },
  4: { name: 'Филёвская', color: '#00BFFF' },
  5: { name: 'Кольцевая', color: '#8D5B2D' },
  6: { name: 'Калужско-Рижская', color: '#ED9121' },
  7: { name: 'Таганско-Краснопресненская', color: '#94238F' },
  8: { name: 'Калининская', color: '#FFD702' },
  9: { name: 'Серпуховско-Тимирязевская', color: '#ACADAF' },
  10: { name: 'Люблинско-Дмитровская', color: '#BED12C' },
};

export interface Station {
  name: string;
  lines: number[];
  lat: number;
  lon: number;
}

// Демо-набор: координаты приблизительные. Полный список можно взять
// на бэкенде (например, из открытых данных Москвы) и отдавать через API.
export const STATIONS: Station[] = [
  { name: 'Арбатская', lines: [3], lat: 55.7520, lon: 37.6019 },
  { name: 'Баррикадная', lines: [7], lat: 55.7607, lon: 37.5810 },
  { name: 'Белорусская', lines: [2, 5], lat: 55.7770, lon: 37.5820 },
  { name: 'Библиотека имени Ленина', lines: [1], lat: 55.7514, lon: 37.6098 },
  { name: 'Боровицкая', lines: [9], lat: 55.7509, lon: 37.6093 },
  { name: 'ВДНХ', lines: [6], lat: 55.8216, lon: 37.6415 },
  { name: 'Воробьёвы горы', lines: [1], lat: 55.7100, lon: 37.5590 },
  { name: 'Киевская', lines: [3, 5], lat: 55.7436, lon: 37.5641 },
  { name: 'Китай-город', lines: [6, 7], lat: 55.7548, lon: 37.6318 },
  { name: 'Коломенская', lines: [2], lat: 55.6773, lon: 37.6636 },
  { name: 'Комсомольская', lines: [1, 5], lat: 55.7756, lon: 37.6549 },
  { name: 'Краснопресненская', lines: [5], lat: 55.7603, lon: 37.5769 },
  { name: 'Кропоткинская', lines: [1], lat: 55.7450, lon: 37.6033 },
  { name: 'Курская', lines: [3, 5], lat: 55.7583, lon: 37.6604 },
  { name: 'Лубянка', lines: [1], lat: 55.7600, lon: 37.6252 },
  { name: 'Маяковская', lines: [2], lat: 55.7699, lon: 37.5964 },
  { name: 'Новокузнецкая', lines: [2], lat: 55.7423, lon: 37.6293 },
  { name: 'Октябрьская', lines: [5, 6], lat: 55.7292, lon: 37.6108 },
  { name: 'Охотный Ряд', lines: [1], lat: 55.7570, lon: 37.6159 },
  { name: 'Павелецкая', lines: [2, 5], lat: 55.7297, lon: 37.6390 },
  { name: 'Парк культуры', lines: [1, 5], lat: 55.7355, lon: 37.5945 },
  { name: 'Пушкинская', lines: [7], lat: 55.7658, lon: 37.6041 },
  { name: 'Смоленская', lines: [3], lat: 55.7476, lon: 37.5817 },
  { name: 'Сокольники', lines: [1], lat: 55.7892, lon: 37.6801 },
  { name: 'Театральная', lines: [2], lat: 55.7582, lon: 37.6188 },
  { name: 'Третьяковская', lines: [6, 8], lat: 55.7408, lon: 37.6259 },
  { name: 'Тульская', lines: [9], lat: 55.7099, lon: 37.6222 },
  { name: 'Тверская', lines: [2], lat: 55.7649, lon: 37.6047 },
  { name: 'Царицыно', lines: [2], lat: 55.6199, lon: 37.6693 },
  { name: 'Чеховская', lines: [9], lat: 55.7657, lon: 37.6084 },
  { name: 'Чистые пруды', lines: [1], lat: 55.7650, lon: 37.6386 },
];

export const STATION_BY_NAME = new Map(STATIONS.map((s) => [s.name, s]));
