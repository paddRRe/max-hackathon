import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { verifyInitData } from './initdata';

const TOKEN = 'test-bot-token';
const NOW = new Date('2026-09-30T12:00:00Z').getTime();

// Подписываем так же, как MAX: secret = HMAC('WebAppData', token),
// подпись = hex(HMAC(secret, 'k=v\nk=v')).
function buildInitData(params: Record<string, string>, token: string): string {
  const launch = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('\n');
  const secret = createHmac('sha256', 'WebAppData').update(token).digest();
  const hash = createHmac('sha256', secret).update(launch).digest('hex');
  const all = { ...params, hash };
  return Object.entries(all)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');
}

function baseParams(authDateSec: number): Record<string, string> {
  return {
    auth_date: String(authDateSec),
    query_id: 'q1',
    user: JSON.stringify({ id: 777, first_name: 'Тест' }),
  };
}

describe('verifyInitData', () => {
  it('валидные данные отдают userId', () => {
    const initData = buildInitData(baseParams(Math.floor(NOW / 1000)), TOKEN);
    expect(verifyInitData(initData, TOKEN, NOW)).toEqual({ userId: 777 });
  });
  it('чужой токен не проходит', () => {
    const initData = buildInitData(baseParams(Math.floor(NOW / 1000)), TOKEN);
    expect(verifyInitData(initData, 'другой-токен', NOW)).toBeNull();
  });
  it('подменённый параметр не проходит', () => {
    const initData = buildInitData(baseParams(Math.floor(NOW / 1000)), TOKEN).replace(
      'first_name',
      'first_namX',
    );
    expect(verifyInitData(initData, TOKEN, NOW)).toBeNull();
  });
  it('данные старше 24 часов не проходят', () => {
    const old = Math.floor(NOW / 1000) - 25 * 3600;
    const initData = buildInitData(baseParams(old), TOKEN);
    expect(verifyInitData(initData, TOKEN, NOW)).toBeNull();
  });
  it('без hash не проходит', () => {
    expect(verifyInitData('auth_date=123&user={}', TOKEN, NOW)).toBeNull();
  });
});
