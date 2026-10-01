import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { log } from '../logger';
import { sendMessage } from '../max-api';
import { frontPlaces, type FrontQuery } from './front';
import { polls } from './poll';
import { announcePollWinner } from './announce';
import { cardAttachments, filterPlaces, findPlace, renderCard } from './service';

export const placesRouter = Router();

// Query GET /api/places. Старые параметры фронта (categories, people,
// station, radiusKm, indoorOnly) разбираются как раньше, новые добавляются.
const placesQuerySchema = z.object({
  categories: z.string().optional(),
  people: z.coerce.number().int().min(1).optional(),
  station: z.string().optional(),
  radiusKm: z.coerce.number().positive().optional(),
  indoorOnly: z
    .union([z.string(), z.boolean()])
    .optional()
    .transform((v) => v === true || v === 'true' || v === '1'),
  priceMax: z.coerce.number().int().min(1).max(3).optional(),
  district: z.string().optional(),
  openNow: z
    .union([z.string(), z.boolean()])
    .optional()
    .transform((v) => v === true || v === 'true' || v === '1'),
  sort: z.enum(['rating', 'price', 'name']).optional(),
});

function zodMessage(error: z.ZodError): string {
  const first = error.issues[0];
  if (!first) return 'неверный запрос';
  const where = first.path.join('.') || 'запрос';
  switch (first.code) {
    case 'invalid_type':
      return `неверный запрос: ${where} — не тот тип данных`;
    case 'invalid_value':
      return `неверный запрос: ${where} — надо одно из: ${first.values.join(', ')}`;
    case 'too_small':
      return `неверный запрос: ${where} — слишком мало (минимум ${first.minimum})`;
    case 'too_big':
      return `неверный запрос: ${where} — слишком много (максимум ${first.maximum})`;
    default:
      return `неверный запрос: ${where} — ${first.message}`;
  }
}

// GET /api/places — ответ в форме фронта (webapp/src/types/places.ts).
// Параметры те же, что шлёт фронт: categories (walk,food,...), people,
// station (русское название), radiusKm, indoorOnly.
placesRouter.get('/places', (req: Request, res: Response) => {
  const parsed = placesQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: zodMessage(parsed.error) });
    return;
  }
  const q = parsed.data;
  const query: FrontQuery = {
    categories: q.categories,
    people: q.people,
    station: q.station,
    radiusKm: q.radiusKm,
    indoorOnly: q.indoorOnly,
    priceMax: q.priceMax,
    district: q.district,
    openNow: q.openNow,
    sort: q.sort,
  };
  try {
    res.json(frontPlaces(query));
  } catch (err) {
    res.status(400).json({ ok: false, error: (err as Error).message });
  }
});

const suggestSchema = z.object({
  placeId: z.string().min(1, 'укажите placeId'),
  // Фронт шлёт chatId из Bridge, а вне чата — null. Без чата отправлять некуда.
  chatId: z.number().int('chatId должен быть целым числом').nullable(),
  initData: z.string().optional(),
});

// POST /api/suggest { placeId, chatId } — бот шлёт карточку места в чат.
placesRouter.post('/suggest', async (req: Request, res: Response) => {
  const parsed = suggestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: zodMessage(parsed.error) });
    return;
  }
  const { placeId, chatId } = parsed.data;
  if (chatId === null) {
    res.status(400).json({ ok: false, error: 'откройте приложение из чата — без чата некуда отправлять' });
    return;
  }

  const place = findPlace(placeId);
  if (!place) {
    res.status(404).json({ ok: false, error: 'такое место не найдено' });
    return;
  }

  try {
    // У карточки своя мини-голосовалка, чтобы кнопка «Голосую» работала сразу.
    const poll = polls.create(chatId, [place.id]);
    polls.armTimer(poll.id, announcePollWinner);
    try {
      await sendMessage(chatId, renderCard(place), cardAttachments(place, { votePayload: `vote:${poll.id}:${place.id}` }));
    } catch (err) {
      polls.remove(poll.id);
      throw err;
    }
    res.json({ ok: true, pollId: poll.id });
  } catch (err) {
    log.warn({ err }, 'не вышло отправить карточку');
    res.status(502).json({ ok: false, error: 'не вышло отправить в чат, попробуйте позже' });
  }
});

const pollCreateSchema = z.object({
  chatId: z.number().int('chatId должен быть целым числом'),
  placeIds: z.array(z.string().min(1)).min(2, 'нужно 2–3 места').max(3, 'нужно 2–3 места'),
  expectedVoters: z.number().int().min(1).optional(),
});

// POST /api/poll { chatId, placeIds (2-3), expectedVoters? } — карточки с кнопками уходят в чат.
placesRouter.post('/poll', async (req: Request, res: Response) => {
  const parsed = pollCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: zodMessage(parsed.error) });
    return;
  }
  const { chatId, placeIds, expectedVoters } = parsed.data;

  const places = placeIds.map(findPlace);
  const missing = placeIds.filter((_, i) => !places[i]);
  if (missing.length > 0) {
    res.status(404).json({ ok: false, error: `места не найдены: ${missing.join(', ')}` });
    return;
  }

  try {
    const poll = polls.create(chatId, placeIds, expectedVoters);
    polls.armTimer(poll.id, announcePollWinner);
    try {
      for (const place of places) {
        if (!place) continue;
        await sendMessage(
          chatId,
          renderCard(place),
          cardAttachments(place, { votePayload: `vote:${poll.id}:${place.id}` }),
        );
      }
    } catch (err) {
      polls.remove(poll.id);
      throw err;
    }
    res.json({ ok: true, pollId: poll.id });
  } catch (err) {
    log.warn({ err }, 'не вышло отправить опрос');
    res.status(502).json({ ok: false, error: 'не вышло отправить в чат, попробуйте позже' });
  }
});

// GET /api/poll/:id — текущие результаты голосования.
placesRouter.get('/poll/:id', (req: Request, res: Response) => {
  const results = polls.results(req.params.id);
  if (!results) {
    res.status(404).json({ ok: false, error: 'такого опроса нет' });
    return;
  }
  res.json({ ok: true, ...results });
});
