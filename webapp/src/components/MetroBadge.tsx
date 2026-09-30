import { LINES, STATION_BY_NAME } from '../data/metro';

export function MetroBadge({ station }: { station: string }) {
  const st = STATION_BY_NAME.get(station);
  return (
    <span className="metro">
      <span className="metro__dots" aria-hidden="true">
        {st?.lines.map((line) => (
          <i key={line} style={{ background: LINES[line].color }} title={LINES[line].name} />
        ))}
      </span>
      м. {station}
    </span>
  );
}
