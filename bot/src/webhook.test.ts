import { beforeEach, describe, expect, it, vi } from 'vitest';

const sendMessage = vi.fn();
const sendMessageToUser = vi.fn();
const answerCallback = vi.fn();

vi.mock('./max-api', () => ({
  sendMessage: (...args: unknown[]) => sendMessage(...args),
  sendMessageToUser: (...args: unknown[]) => sendMessageToUser(...args),
  answerCallback: (...args: unknown[]) => answerCallback(...args),
}));

import { polls } from './places/poll';
import { routeUpdate } from './webhook';

beforeEach(() => {
  vi.clearAllMocks();
  polls.clearAll();
});

describe('routeUpdate', () => {
  it('/start — приветствие', async () => {
    await routeUpdate({
      update_type: 'message_created',
      chat_id: 10,
      message: { sender: { user_id: 5 }, body: { text: '/start' } },
    });
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(String(sendMessage.mock.calls[0][1])).toContain('Привет');
  });
  it('/help — справка', async () => {
    await routeUpdate({
      update_type: 'message_created',
      chat_id: 10,
      message: { sender: { user_id: 5 }, body: { text: '/help' } },
    });
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(String(sendMessage.mock.calls[0][1])).toContain('мини-приложение');
  });
  it('обычное сообщение — подсказка, не эхо', async () => {
    await routeUpdate({
      update_type: 'message_created',
      chat_id: 10,
      message: { sender: { user_id: 5 }, body: { text: 'привет бот' } },
    });
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(String(sendMessage.mock.calls[0][1])).not.toContain('Echo');
  });
  it('bot_started — привет в личку', async () => {
    await routeUpdate({ update_type: 'bot_started', user: { user_id: 7 } });
    expect(sendMessageToUser).toHaveBeenCalledTimes(1);
    expect(sendMessageToUser.mock.calls[0][0]).toBe(7);
  });
  it('callback vote — голос + answer', async () => {
    const poll = polls.create(10, ['zerno-cafe', 'probka-bar']);
    await routeUpdate({
      update_type: 'message_callback',
      chat_id: 10,
      callback: { callback_id: 'cb1', payload: `vote:${poll.id}:zerno-cafe`, user: { user_id: 5 } },
    });
    expect(answerCallback).toHaveBeenCalledWith('cb1');
    expect(polls.results(poll.id)?.totalVotes).toBe(1);
  });
  it('неизвестный тип — тихо, без отправок', async () => {
    await routeUpdate({ update_type: 'что-то-новое' });
    expect(sendMessage).not.toHaveBeenCalled();
    expect(sendMessageToUser).not.toHaveBeenCalled();
    expect(answerCallback).not.toHaveBeenCalled();
  });
});
