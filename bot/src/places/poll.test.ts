import { beforeEach, describe, expect, it, vi } from 'vitest';
import { calcResults, PollStore, shouldFinish, type Poll } from './poll';

function makePoll(): Poll {
  return {
    id: 'p1',
    chatId: 1,
    placeIds: ['zerno-cafe', 'probka-bar'],
    votes: new Map(),
    createdAt: Date.now(),
    finished: false,
  };
}

describe('calcResults', () => {
  it('считает голоса и находит победителя', () => {
    const poll = makePoll();
    poll.votes.set(1, 'zerno-cafe');
    poll.votes.set(2, 'zerno-cafe');
    poll.votes.set(3, 'probka-bar');
    const res = calcResults(poll);
    expect(res.totalVotes).toBe(3);
    expect(res.winnerPlaceId).toBe('zerno-cafe');
    expect(res.options.find((o) => o.placeId === 'probka-bar')?.votes).toBe(1);
  });
  it('без голосов победителя нет', () => {
    expect(calcResults(makePoll()).winnerPlaceId).toBeNull();
  });
});

describe('PollStore.vote', () => {
  it('один голос на пользователя, повторный клик меняет голос', () => {
    const store = new PollStore();
    const poll = store.create(1, ['zerno-cafe', 'probka-bar']);
    store.vote(poll.id, 5, 'zerno-cafe');
    store.vote(poll.id, 5, 'probka-bar');
    const res = store.results(poll.id);
    expect(res?.totalVotes).toBe(1);
    expect(res?.winnerPlaceId).toBe('probka-bar');
    store.clearAll();
  });
  it('голос за место не из опроса не засчитывается', () => {
    const store = new PollStore();
    const poll = store.create(1, ['zerno-cafe']);
    expect(store.vote(poll.id, 5, 'чужое-место')).toBeNull();
    store.clearAll();
  });
  it('в закрытый опрос не голосуют', async () => {
    const store = new PollStore();
    const poll = store.create(1, ['zerno-cafe']);
    await store.finish(poll.id, () => {});
    expect(store.vote(poll.id, 5, 'zerno-cafe')).toBeNull();
    store.clearAll();
  });
});

describe('shouldFinish', () => {
  it('прошло 10 минут — пора', () => {
    const poll = makePoll();
    poll.createdAt = Date.now() - 11 * 60 * 1000;
    expect(shouldFinish(poll)).toBe(true);
  });
  it('все проголосовали — пора', () => {
    const poll = makePoll();
    poll.expectedVoters = 2;
    poll.votes.set(1, 'zerno-cafe');
    poll.votes.set(2, 'probka-bar');
    expect(shouldFinish(poll)).toBe(true);
  });
  it('рано — не пора', () => {
    const poll = makePoll();
    poll.expectedVoters = 5;
    poll.votes.set(1, 'zerno-cafe');
    expect(shouldFinish(poll)).toBe(false);
  });
});

describe('finish', () => {
  it('зовёт announce один раз', async () => {
    const store = new PollStore();
    const poll = store.create(1, ['zerno-cafe', 'probka-bar']);
    store.vote(poll.id, 1, 'zerno-cafe');
    const announce = vi.fn();
    await store.finish(poll.id, announce);
    await store.finish(poll.id, announce);
    expect(announce).toHaveBeenCalledTimes(1);
    store.clearAll();
  });
});
