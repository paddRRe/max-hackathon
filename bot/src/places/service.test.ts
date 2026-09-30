import { describe, expect, it } from 'vitest';
import { filterPlaces, isOpenNow } from './service';

const noon = new Date(2026, 5, 15, 12, 0); // понедельник, 12:00
const night = new Date(2026, 5, 15, 3, 0); // 03:00 ночи

describe('старые фильтры работают как раньше', () => {
  it('categories + people', () => {
    const res = filterPlaces({ categories: 'cafe', people: 8 }, noon);
    expect(res.map((p) => p.id)).toEqual(['veranda-cafe']);
  });
  it('station + radius', () => {
    const res = filterPlaces({ station: 'Arbatskaya', radiusKm: 1 }, noon);
    expect(res.map((p) => p.id).sort()).toEqual(['oktyabr-cinema', 'ugol-restaurant']);
  });
  it('indoorOnly выкидывает улицу', () => {
    const res = filterPlaces({ categories: 'park', indoorOnly: true }, noon);
    expect(res).toEqual([]);
  });
  it('неизвестная станция — ошибка', () => {
    expect(() => filterPlaces({ station: 'Nope' }, noon)).toThrow();
  });
});

describe('новые фильтры', () => {
  it('priceMax', () => {
    const res = filterPlaces({ priceMax: 1 }, noon);
    expect(res.length).toBeGreaterThan(0);
    expect(res.every((p) => (p.priceLevel ?? 0) <= 1)).toBe(true);
  });
  it('district', () => {
    const res = filterPlaces({ district: 'Таганский' }, noon);
    expect(res.map((p) => p.id).sort()).toEqual(['labirint-quest', 'mama-restaurant']);
  });
  it('openNow днём и ночью различаются', () => {
    const day = filterPlaces({ openNow: true }, noon).map((p) => p.id);
    const late = filterPlaces({ openNow: true }, night).map((p) => p.id);
    expect(day).toContain('zerno-cafe');
    expect(late).not.toContain('zerno-cafe');
    expect(late).toContain('golosa-karaoke'); // 18:00–06:00, через полночь
  });
  it('sort=rating — по убыванию', () => {
    const res = filterPlaces({ sort: 'rating' }, noon);
    const ratings = res.map((p) => p.rating ?? 0);
    expect([...ratings].sort((a, b) => b - a)).toEqual(ratings);
  });
  it('sort=price — дешёвые первые', () => {
    const res = filterPlaces({ sort: 'price' }, noon);
    expect(res[0].priceLevel).toBe(1);
  });
  it('sort=name — по алфавиту', () => {
    const res = filterPlaces({ sort: 'name' }, noon);
    const names = res.map((p) => p.name);
    expect([...names].sort((a, b) => a.localeCompare(b, 'ru'))).toEqual(names);
  });
});

describe('isOpenNow', () => {
  it('круглосуточно — всегда открыто', () => {
    expect(isOpenNow('круглосуточно', night)).toBe(true);
  });
  it('интервал через полночь', () => {
    expect(isOpenNow('18:00–06:00', night)).toBe(true);
    expect(isOpenNow('18:00–06:00', noon)).toBe(false);
  });
  it('непонятные часы не прячут место', () => {
    expect(isOpenNow('по записи', noon)).toBe(true);
    expect(isOpenNow(undefined, noon)).toBe(true);
  });
});
