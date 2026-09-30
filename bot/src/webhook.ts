import { timingSafeEqual } from 'node:crypto';
import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { log } from './logger';
import { answerCallback, sendMessage, sendMessageToUser } from './max-api';
import { polls } from './places/poll';
import { announcePollWinner } from './places/announce';

// Типы апдейтов сверены с https://dev.max.ru/docs-api/objects/Update.
const updateSchema = z
  .object({ update_type: z.string() })
  .passthrough();

export interface BotUpdate {
  update_type: string;
  timestamp?: number;
  chat_id?: number;
  message?: { sender?: { user_id?: number }; body?: { text?: string; mid?: string } };
  callback?: { callback_id?: string; payload?: string; user?: { user_id?: number } };
  user?: { user_id?: number };
  [key: string]: unknown;
}

const GREETING =
  'Привет! Я помогу выбрать место для встречи компанией. Открой мини-приложение, настрой фильтры и отправь место в чат — там можно голосовать.';
const HELP =
  'Я ищу места для встреч: кафе, бары, коворкинги и не только. Открой мини-приложение, выбери место и нажми «Предложить в чат». В чате можно голосовать за варианты.';
const HINT = 'Открой мини-приложение и выбери место — я отправлю его в чат для голосования.';

/** Кнопка «Открыть мини-приложение». Без WEBAPP_URL кнопка не добавляется. */
function openAppKeyboard(): Record<string, unknown>[] | undefined {
  const url = process.env.WEBAPP_URL;
  if (!url) return undefined;
  return [
    {
      type: 'inline_keyboard',
      payload: { buttons: [[{ type: 'open_app', text: 'Открыть мини-приложение', web_app: url }]] },
    },
  ];
}

// Дедупликация: MAX может повторить доставку, дважды не обрабатываем.
const seen = new Map<string, number>();
function dedupeKey(update: BotUpdate): string {
  return (
    update.callback?.callback_id ??
    update.message?.body?.mid ??
    `${update.update_type}:${update.chat_id ?? 0}:${update.timestamp ?? 0}`
  );
}
function isDuplicate(update: BotUpdate): boolean {
  const key = dedupeKey(update);
  const now = Date.now();
  if (seen.has(key)) return true;
  seen.set(key, now);
  if (seen.size > 2000) {
    for (const [k, t] of seen) {
      if (now - t > 10 * 60 * 1000) seen.delete(k);
      if (seen.size <= 1500) break;
    }
  }
  return false;
}

function secretsEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export const webhookRouter = Router();

webhookRouter.post('/', (req: Request, res: Response) => {
  const expected = process.env.WEBHOOK_SECRET ?? '';
  const got = req.header('X-Max-Bot-Api-Secret') ?? '';
  if (expected && !secretsEqual(got, expected)) {
    res.status(403).json({ ok: false, error: 'плохой секрет' });
    return;
  }

  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: 'непонятный апдейт от MAX' });
    return;
  }
  const update = req.body as BotUpdate;

  // Отвечаем 200 сразу, обработку делаем после — у MAX таймаут 30 секунд.
  res.status(200).json({ ok: true });
  setImmediate(() => {
    if (isDuplicate(update)) {
      log.debug({ key: dedupeKey(update) }, 'повторный апдейт, пропускаю');
      return;
    }
    routeUpdate(update).catch((err) => log.warn({ err }, 'не вышло обработать апдейт'));
  });
});

async function sendHint(chatId: number | undefined, userId: number | undefined, text: string) {
  const keyboard = openAppKeyboard();
  if (chatId) await sendMessage(chatId, text, keyboard);
  else if (userId) await sendMessageToUser(userId, text, keyboard);
}

/** Разбор голосования из кнопки «Голосую»: vote:<pollId>:<placeId>. */
async function handleVote(update: BotUpdate): Promise<boolean> {
  const payload = update.callback?.payload ?? '';
  const parts = payload.split(':');
  if (parts.length !== 3 || parts[0] !== 'vote') return false;
  const [, pollId, placeId] = parts;
  const callbackId = update.callback?.callback_id;
  if (callbackId) {
    try {
      await answerCallback(callbackId);
    } catch (err) {
      log.warn({ err }, 'не вышло ответить на callback');
    }
  }
  const userId = update.callback?.user?.user_id;
  if (userId === undefined) {
    log.warn({ pollId }, 'в callback нет user_id, голос не засчитан');
    return true;
  }
  const poll = polls.vote(pollId, userId, placeId);
  if (!poll) {
    log.warn({ pollId, placeId }, 'голос в несуществующий опрос');
    return true;
  }
  log.info({ pollId, userId, placeId }, 'голос засчитан');
  await polls.maybeFinish(pollId, announcePollWinner);
  return true;
}

export async function routeUpdate(update: BotUpdate): Promise<void> {
  switch (update.update_type) {
    case 'bot_started': {
      const userId = update.user?.user_id;
      if (userId) await sendMessageToUser(userId, GREETING, openAppKeyboard());
      break;
    }
    case 'message_created': {
      const text = (update.message?.body?.text ?? '').trim();
      const chatId = update.chat_id;
      const userId = update.message?.sender?.user_id;
      if (text === '/start') {
        await sendHint(chatId, userId, GREETING);
      } else if (text === '/help') {
        await sendHint(chatId, userId, HELP);
      } else {
        await sendHint(chatId, userId, HINT);
      }
      break;
    }
    case 'message_callback': {
      if (!(await handleVote(update))) {
        const callbackId = update.callback?.callback_id;
        if (callbackId) {
          try {
            await answerCallback(callbackId);
          } catch (err) {
            log.warn({ err }, 'не вышло ответить на callback');
          }
        }
        log.info({ payload: update.callback?.payload }, 'неизвестный callback');
      }
      break;
    }
    default: {
      log.info({ type: update.update_type }, 'неизвестный тип апдейта, пропускаю');
    }
  }
}
