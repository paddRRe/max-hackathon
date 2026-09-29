import type { CSSProperties } from 'react';
import { Button, Typography } from '@maxhub/max-ui';
import { LINES, STATION_BY_NAME } from '../data/metro';
import { CATEGORY_LABELS, type PlaceResult } from '../types/places';
import { formatKm, routeUrl, walkMinutes } from '../utils/geo';
import { MetroBadge } from './MetroBadge';

interface Props {
  place: PlaceResult;
  /** Станция, от которой считали расстояние. */
  fromStation: string | null;
  onSuggest: (place: PlaceResult) => void;
}

export function PlaceCard({ place, fromStation, onSuggest }: Props) {
  const st = STATION_BY_NAME.get(place.metro);
  const accent = st ? LINES[st.lines[0]].color : '#8a8f98';

  return (
    <article className="card" style={{ '--line': accent } as CSSProperties}>
      <div className="card__head">
        <Typography.Title>{place.name}</Typography.Title>
        <Typography.Label>{CATEGORY_LABELS[place.category]}</Typography.Label>
      </div>

      <div className="card__where">
        <MetroBadge station={place.metro} />
        <Typography.Label>{place.address}</Typography.Label>
        {place.distanceKm != null && fromStation && (
          <Typography.Label>
            {formatKm(place.distanceKm)} км от м. {fromStation}, около {walkMinutes(place.distanceKm)} мин пешком
          </Typography.Label>
        )}
      </div>

      <Typography.Body>{place.blurb}</Typography.Body>

      <ul className="tags">
        <li>{'₽'.repeat(place.price)}</li>
        <li>до {place.maxGroup} человек</li>
        <li>{place.indoor ? 'В помещении' : 'На улице'}</li>
      </ul>

      <div className="card__actions">
        <Button
          size="small"
          variant="secondary"
          onClick={() => window.open(routeUrl(place.lat, place.lon), '_blank', 'noopener')}
        >
          Маршрут
        </Button>
        <Button size="small" onClick={() => onSuggest(place)}>
          Предложить в чат
        </Button>
      </div>
    </article>
  );
}
