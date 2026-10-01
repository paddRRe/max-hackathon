import { describe, expect, it } from 'vitest';
import { frontPlaces } from './front';

const FRONT_KEYS = [
  'id',
  'name',
  'category',
  'metro',
  'address',
  'lat',
  'lon',
  'indoor',
  'price',
  'maxGroup',
  'blurb',
  'distanceKm',
].sort();

describe('frontPlaces — форма фронта', () => {
  it('отдаёт ровно поля PlaceResult фронта', () => {
    const res = frontPlaces({ people: 4, radiusKm: 3 });
    expect(res.length).toBeGreaterThan(0);
    for (const p of res) {
      expect(Object.keys(p).sort()).toEqual(FRONT_KEYS);
    }
  });
  it('категории фронта: food находит кафе и рестораны', () => {
    const res = frontPlaces({ categories: 'food', people: 1 });
    expect(res.length).toBeGreaterThan(0);
    expect(res.every((p) => p.category === 'food')).toBe(true);
  });
  it('русская станция считается, distanceKm — число', () => {
    const res = frontPlaces({ station: 'Китай-город', radiusKm: 3, people: 1 });
    expect(res.length).toBeGreaterThan(0);
    expect(res.every((p) => typeof p.distanceKm === 'number')).toBe(true);
    const dists = res.map((p) => p.distanceKm as number);
    expect([...dists].sort((a, b) => a - b)).toEqual(dists);
  });
  it('без станции distanceKm null и сортировка по имени', () => {
    const res = frontPlaces({ people: 1 });
    expect(res.every((p) => p.distanceKm === null)).toBe(true);
    const names = res.map((p) => p.name);
    expect([...names].sort((a, b) => a.localeCompare(b, 'ru'))).toEqual(names);
  });
  it('метро — русское название', () => {
    const res = frontPlaces({ categories: 'bar', people: 1 });
    const metros = res.map((p) => p.metro).sort();
    expect(metros).toEqual(['Китай-город', 'Новослободская']);
  });
  it('неизвестная станция — ошибка', () => {
    expect(() => frontPlaces({ station: 'Нетакой' })).toThrow();
  });
});
