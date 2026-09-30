import type { NextFunction, Request, Response } from 'express';
import { log } from './logger';
import { MaxApiError } from './max-api';

// Оборачивает async-обработчики: ошибки идут в error-middleware, а не валят процесс.
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

// Единый формат ошибок. Никаких stack trace и токенов в ответах.
export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof MaxApiError) {
    log.warn({ status: err.status }, 'MAX API вернул ошибку');
    res.status(502).json({ ok: false, error: 'MAX API недоступно, попробуйте позже' });
    return;
  }
  if (err instanceof SyntaxError && 'body' in (err as object)) {
    res.status(400).json({ ok: false, error: 'битый JSON в теле запроса' });
    return;
  }
  log.warn({ err }, 'необработанная ошибка запроса');
  if (res.headersSent) return;
  res.status(500).json({ ok: false, error: 'что-то пошло не так, попробуйте позже' });
}
