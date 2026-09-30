import { useEffect, useState, type CSSProperties } from 'react';
import { Spinner, Typography } from '@maxhub/max-ui';
import { fetchPlaces } from './api/places';
import { suggestToChat } from './api/share';
import { fetchMoscowWeather, type Weather } from './api/weather';
import { FilterPanel } from './components/FilterPanel';
import { PlaceCard } from './components/PlaceCard';
import type { PlaceResult, Query } from './types/places';

const DEFAULT_QUERY: Query = { categories: [], people: 4, station: null, radiusKm: 3 };

type Status = 'loading' | 'ready' | 'error';

export default function App() {
  const [query, setQuery] = useState<Query>(DEFAULT_QUERY);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [weatherAware, setWeatherAware] = useState(true);
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [notice, setNotice] = useState('');

  const indoorOnly = weatherAware && weather?.isBad === true;

  useEffect(() => {
    const controller = new AbortController();
    fetchMoscowWeather(controller.signal).then(setWeather);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    fetchPlaces({ ...query, indoorOnly })
      .then((list) => {
        if (cancelled) return;
        setResults(list);
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [query, indoorOnly]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(''), 3000);
    return () => clearTimeout(t);
  }, [notice]);

  async function handleSuggest(place: PlaceResult) {
    const result = await suggestToChat(place);
    setNotice(
      result === 'sent'
        ? `«${place.name}» отправлено в чат`
        : result === 'copied'
          ? 'Описание места скопировано, вставьте его в чат'
          : 'Не получилось отправить. Попробуйте ещё раз',
    );
  }

  return (
    <main className="app">
      <header className="app__head">
        <Typography.Headline>Куда пойдём?</Typography.Headline>
        <Typography.Body>Подберите место для встречи в Москве и отправьте друзьям.</Typography.Body>
      </header>

      <FilterPanel
        value={query}
        onChange={setQuery}
        weather={weather}
        weatherAware={weatherAware}
        onWeatherAware={setWeatherAware}
      />

      <section aria-label="Места" aria-busy={status === 'loading'}>
        {status === 'loading' && results.length === 0 && (
          <div className="center">
            <Spinner />
          </div>
        )}

        {status === 'error' && (
          <div className="empty">
            <Typography.Body>Не удалось загрузить места. Проверьте соединение и измените фильтры, чтобы повторить.</Typography.Body>
          </div>
        )}

        {status !== 'error' && (
          <ul className="list">
            {results.map((place, i) => (
              <li key={place.id} style={{ '--i': Math.min(i, 8) } as CSSProperties}>
                <PlaceCard place={place} fromStation={query.station} onSuggest={handleSuggest} />
              </li>
            ))}
          </ul>
        )}

        {status === 'ready' && results.length === 0 && (
          <div className="empty">
            <Typography.Body>Ничего не нашлось. Увеличьте расстояние, уберите часть категорий или уменьшите компанию.</Typography.Body>
          </div>
        )}
      </section>

      <div className="toast-region" role="status" aria-live="polite">
        {notice && (
          <div className="toast" key={notice}>
            {notice}
          </div>
        )}
      </div>
    </main>
  );
}
