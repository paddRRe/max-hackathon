import { Router, type Request, type Response } from 'express';
import { sendMessage } from '../max-api';
import type { PlacesQuery, SuggestRequest } from './types';
import { cardAttachments, filterPlaces, findPlace, renderCard } from './service';

export const placesRouter = Router();

// GET /api/places?categories=&people=&station=&radiusKm=&indoorOnly=
placesRouter.get('/places', (req: Request, res: Response) => {
  const peopleRaw = req.query.people as string | undefined;
  const radiusRaw = req.query.radiusKm as string | undefined;
  const indoorRaw = req.query.indoorOnly as string | undefined;

  const people = peopleRaw !== undefined ? Number(peopleRaw) : undefined;
  if (people !== undefined && (!Number.isInteger(people) || people < 1)) {
    res.status(400).json({ ok: false, error: 'people must be a positive integer' });
    return;
  }
  const radiusKm = radiusRaw !== undefined ? Number(radiusRaw) : undefined;
  if (radiusKm !== undefined && (!Number.isFinite(radiusKm) || radiusKm <= 0)) {
    res.status(400).json({ ok: false, error: 'radiusKm must be a positive number' });
    return;
  }

  const query: PlacesQuery = {
    categories: req.query.categories as string | undefined,
    people,
    station: req.query.station as string | undefined,
    radiusKm,
    indoorOnly: indoorRaw === 'true' || indoorRaw === '1',
  };

  try {
    res.json(filterPlaces(query));
  } catch (err) {
    res.status(400).json({ ok: false, error: (err as Error).message });
  }
});

// POST /api/suggest { placeId, chatId, initData? } — bot sends the card to the chat.
placesRouter.post('/suggest', async (req: Request, res: Response) => {
  const body = req.body as Partial<SuggestRequest>;

  if (typeof body.placeId !== 'string' || body.placeId.length === 0) {
    res.status(400).json({ ok: false, error: 'placeId is required' });
    return;
  }
  if (typeof body.chatId !== 'number' || !Number.isInteger(body.chatId)) {
    res.status(400).json({ ok: false, error: 'chatId must be an integer' });
    return;
  }

  // TODO(security): validate body.initData against MAX_BOT_TOKEN (HMAC, see
  // https://dev.max.ru/docs/webapps/validation) so strangers cannot use the
  // bot to spam arbitrary chats.
  const place = findPlace(body.placeId);
  if (!place) {
    res.status(404).json({ ok: false, error: 'place not found' });
    return;
  }

  try {
    await sendMessage(body.chatId, renderCard(place), cardAttachments(place));
    res.json({ ok: true });
  } catch (err) {
    res.status(502).json({ ok: false, error: (err as Error).message });
  }
});
