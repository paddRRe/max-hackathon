import { createHmac, timingSafeEqual } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

// Проверка initData мини-приложения по схеме MAX:
// https://dev.max.ru/docs/webapps/validation
// secret_key = HMAC-SHA256('WebAppData', BOT_TOKEN),
// подпись = hex(HMAC-SHA256(secret_key, launch_params)).
// Чистые функции — тестируются без Express.

const MAX_AGE_MS = 24 * 60 * 60 * 1000; // данные старше суток не принимаем

export interface InitDataInfo {
  userId?: number;
}

export function verifyInitData(initData: string, botToken: string, now = Date.now()): InitDataInfo | null {
  const pairs = initData.split('&').map((x) => {
    const eq = x.indexOf('=');
    return eq === -1 ? [x, ''] : [x.slice(0, eq), x.slice(eq + 1)];
  });
  if (pairs.filter(([k]) => k === 'hash').length !== 1) return null;
  const originalHash = pairs.find(([k]) => k === 'hash')?.[1];
  if (!originalHash) return null;

  const decoded = pairs.map(([k, v]) => {
    try {
      return [k, decodeURIComponent(v)];
    } catch {
      return null;
    }
  });
  if (decoded.some((p) => p === null)) return null;
  const params = (decoded as string[][]).sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  const launchParams = params
    .filter(([k]) => k !== 'hash')
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
  const signature = createHmac('sha256', secretKey).update(launchParams).digest('hex');
  const a = Buffer.from(signature);
  const b = Buffer.from(originalHash);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const authDate = Number(params.find(([k]) => k === 'auth_date')?.[1]);
  if (!Number.isFinite(authDate) || now - authDate * 1000 > MAX_AGE_MS) return null;

  let userId: number | undefined;
  try {
    const user = JSON.parse(params.find(([k]) => k === 'user')?.[1] ?? 'null') as { id?: unknown } | null;
    if (typeof user?.id === 'number') userId = user.id;
  } catch {
    return null;
  }
  return { userId };
}

declare global {
  namespace Express {
    interface Request {
      initUserId?: number;
    }
  }
}

/**
 * Этот middleware вешается на /api. Когда REQUIRE_INIT_DATA выключен —
 * просто пропускает всех (фронт пока не шлёт заголовок, ничего не ломается).
 */
export function initDataMiddleware(botToken: string, required: boolean) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!required) {
      next();
      return;
    }
    const header = req.header('X-Max-Init-Data');
    if (!header) {
      res.status(401).json({ ok: false, error: 'нужен заголовок X-Max-Init-Data' });
      return;
    }
    const info = verifyInitData(header, botToken);
    if (!info) {
      res.status(401).json({ ok: false, error: 'плохая подпись или данные старше 24 часов' });
      return;
    }
    req.initUserId = info.userId;
    next();
  };
}
