import { useState } from 'react';
import { Button, Input, Switch, Typography } from '@maxhub/max-ui';
import type { Weather } from '../api/weather';
import { STATIONS, STATION_BY_NAME } from '../data/metro';
import { CATEGORY_LABELS, type Category, type Query } from '../types/places';

const CATEGORIES = Object.keys(CATEGORY_LABELS) as Category[];
const MIN_PEOPLE = 2;
const MAX_PEOPLE = 20;

interface Props {
  value: Query;
  onChange: (next: Query) => void;
  weather: Weather | null;
  weatherAware: boolean;
  onWeatherAware: (on: boolean) => void;
}

function weatherText(weather: Weather | null, aware: boolean): string {
  if (!weather) return 'Погода недоступна, показываем всё';
  const now = `${Math.round(weather.tempC)}°, ${weather.isBad ? 'осадки или мороз' : 'без осадков'}`;
  return weather.isBad && aware ? `${now}. Показываем места в помещении` : now;
}

export function FilterPanel({ value, onChange, weather, weatherAware, onWeatherAware }: Props) {
  const [stationText, setStationText] = useState(value.station ?? '');

  function toggleCategory(cat: Category) {
    const has = value.categories.includes(cat);
    onChange({
      ...value,
      categories: has ? value.categories.filter((c) => c !== cat) : [...value.categories, cat],
    });
  }

  return (
    <section className="filters" aria-label="Фильтры">
      <div className="field">
        <Typography.Label>Что ищем</Typography.Label>
        <div className="chips">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              className="chip"
              aria-pressed={value.categories.includes(cat)}
              onClick={() => toggleCategory(cat)}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      <div className="field field--row">
        <Typography.Label>Сколько вас</Typography.Label>
        <div className="stepper">
          <Button
            size="small"
            variant="secondary"
            aria-label="Меньше людей"
            disabled={value.people <= MIN_PEOPLE}
            onClick={() => onChange({ ...value, people: value.people - 1 })}
          >
            −
          </Button>
          <output aria-live="polite">{value.people}</output>
          <Button
            size="small"
            variant="secondary"
            aria-label="Больше людей"
            disabled={value.people >= MAX_PEOPLE}
            onClick={() => onChange({ ...value, people: value.people + 1 })}
          >
            +
          </Button>
        </div>
      </div>

      <div className="field">
        <Typography.Label>Ближайшее метро</Typography.Label>
        <Input
          value={stationText}
          placeholder="Начните вводить станцию"
          list="metro-stations"
          onChange={(e) => {
            const text = e.target.value;
            setStationText(text);
            onChange({ ...value, station: STATION_BY_NAME.has(text) ? text : null });
          }}
        />
        <datalist id="metro-stations">
          {STATIONS.map((s) => (
            <option key={s.name} value={s.name} />
          ))}
        </datalist>
      </div>

      <div className="field">
        <label htmlFor="radius">
          <Typography.Label>
            {value.station ? `Не дальше ${value.radiusKm} км от станции` : 'Выберите станцию, чтобы искать рядом'}
          </Typography.Label>
        </label>
        <input
          id="radius"
          type="range"
          min={0.5}
          max={10}
          step={0.5}
          value={value.radiusKm}
          disabled={!value.station}
          onChange={(e) => onChange({ ...value, radiusKm: Number(e.target.value) })}
        />
      </div>

      <label className="field field--row">
        <span>
          <Typography.Body>Учитывать погоду</Typography.Body>
          <br />
          <Typography.Label>{weatherText(weather, weatherAware)}</Typography.Label>
        </span>
        <Switch checked={weatherAware} onChange={(e) => onWeatherAware(e.target.checked)} />
      </label>
    </section>
  );
}
