import { Router, type Request, type Response } from 'express';
import { sendMessage, sendMessageToUser } from './max-api';

// Update types verified against https://dev.max.ru/docs-api/objects/Update:
// message_created, message_callback, bot_started, bot_stopped, bot_added,
// bot_removed, message_edited, message_removed, chat_title_changed,
// dialog_*, user_added, user_removed, comment_*, bot_admin_permissions_changed.
interface Update {
  update_type: string;
  timestamp?: number;
  chat_id?: number;
  message?: { sender?: { user_id?: number }; body?: { text?: string; mid?: string } };
  callback?: { payload?: string; user?: { user_id?: number } };
  user?: { user_id?: number };
  [key: string]: unknown;
}

export const webhookRouter = Router();

webhookRouter.post('/', async (req: Request, res: Response) => {
  const expected = process.env.WEBHOOK_SECRET;
  if (expected) {
    const got = req.header('X-Max-Bot-Api-Secret');
    if (got !== expected) {
      res.status(403).json({ ok: false, error: 'bad secret' });
      return;
    }
  }

  const update = req.body as Update;

  try {
    await routeUpdate(update);
  } catch (err) {
    console.error('webhook handler error', err);
  }

  // MAX requires HTTP 200 within 30s, otherwise it retries delivery.
  res.status(200).json({ ok: true });
});

async function routeUpdate(update: Update): Promise<void> {
  switch (update.update_type) {
    case 'message_created': {
      const text: string = update.message?.body?.text ?? '';
      const chatId = update.chat_id;
      const userId = update.message?.sender?.user_id;
      // Echo back so the wiring can be verified end-to-end.
      // TODO(scenario): replace echo with the real scenario logic entry point.
      const reply = text ? `Echo: ${text}` : 'Echo: (empty message)';
      if (chatId) await sendMessage(chatId, reply);
      else if (userId) await sendMessageToUser(userId, reply);
      break;
    }
    case 'message_callback': {
      // TODO(scenario): handle inline-keyboard button presses (payload below).
      const payload = update.callback?.payload;
      console.log('message_callback payload:', payload);
      break;
    }
    case 'bot_started': {
      // TODO(scenario): handle first contact (/start) — e.g. onboarding message.
      console.log('bot_started by user:', update.user?.user_id);
      break;
    }
    default: {
      // TODO(scenario): handle other update types as needed.
      console.log('unhandled update_type:', update.update_type);
    }
  }
}
