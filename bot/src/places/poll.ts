import { randomBytes } from 'node:crypto';
import { log } from '../logger';
import { findPlace } from './service';

// Голосование за места. Всё в памяти процесса — для хакатона хватает,
// после перезапуска опросы сбрасываются. Один голос на пользователя,
// повторный клик переносит голос на другое место.

export interface Poll {
  id: string;
  chatId: number;
  placeIds: string[];
  votes: Map<number, string>; // userId -> placeId
  createdAt: number;
  expectedVoters?: number;
  finished: boolean;
}

export interface PollResults {
  pollId: string;
  chatId: number;
  finished: boolean;
  totalVotes: number;
  options: { placeId: string; placeName: string; votes: number }[];
  winnerPlaceId: string | null;
}

const POLL_TTL_MS = 10 * 60 * 1000; // через 10 минут подводим итоги

function newId(): string {
  return randomBytes(8).toString('hex');
}

/** Чистая логика: посчитать результаты опроса. */
export function calcResults(poll: Poll): PollResults {
  const counts = new Map<string, number>();
  for (const placeId of poll.votes.values()) {
    counts.set(placeId, (counts.get(placeId) ?? 0) + 1);
  }
  const options = poll.placeIds.map((placeId) => ({
    placeId,
    placeName: findPlace(placeId)?.name ?? placeId,
    votes: counts.get(placeId) ?? 0,
  }));
  let winnerPlaceId: string | null = null;
  let best = 0;
  for (const o of options) {
    if (o.votes > best) {
      best = o.votes;
      winnerPlaceId = o.placeId;
    }
  }
  return {
    pollId: poll.id,
    chatId: poll.chatId,
    finished: poll.finished,
    totalVotes: poll.votes.size,
    options,
    winnerPlaceId: best > 0 ? winnerPlaceId : null,
  };
}

/** Чистая логика: пора ли закрывать опрос. */
export function shouldFinish(poll: Poll, now = Date.now()): boolean {
  if (poll.finished) return true;
  if (now - poll.createdAt >= POLL_TTL_MS) return true;
  if (poll.expectedVoters !== undefined && poll.votes.size >= poll.expectedVoters) return true;
  return false;
}

type Announce = (poll: Poll, results: PollResults) => Promise<void> | void;

export class PollStore {
  private polls = new Map<string, Poll>();
  private timers = new Map<string, NodeJS.Timeout>();

  create(chatId: number, placeIds: string[], expectedVoters?: number): Poll {
    const poll: Poll = {
      id: newId(),
      chatId,
      placeIds,
      votes: new Map(),
      createdAt: Date.now(),
      expectedVoters,
      finished: false,
    };
    this.polls.set(poll.id, poll);
    return poll;
  }

  get(pollId: string): Poll | undefined {
    return this.polls.get(pollId);
  }

  /** Удалить опрос (если отправка карточек не удалась — не копим мусор). */
  remove(pollId: string): void {
    this.clearTimer(pollId);
    this.polls.delete(pollId);
  }

  /** Записать голос. Возвращает null, если опрос закрыт или место не из опроса. */
  vote(pollId: string, userId: number, placeId: string): Poll | null {
    const poll = this.polls.get(pollId);
    if (!poll || poll.finished) return null;
    if (!poll.placeIds.includes(placeId)) return null;
    poll.votes.set(userId, placeId);
    return poll;
  }

  results(pollId: string): PollResults | null {
    const poll = this.polls.get(pollId);
    return poll ? calcResults(poll) : null;
  }

  /** Закрыть опрос и объявить победителя через announce. */
  async finish(pollId: string, announce: Announce): Promise<PollResults | null> {
    const poll = this.polls.get(pollId);
    if (!poll || poll.finished) return poll ? calcResults(poll) : null;
    poll.finished = true;
    this.clearTimer(pollId);
    const results = calcResults(poll);
    // Итоги пишем, только если есть за что: несколько вариантов или хоть один голос.
    if (poll.placeIds.length > 1 || results.totalVotes > 0) {
      try {
        await announce(poll, results);
      } catch (err) {
        log.warn({ err, pollId }, 'не вышло объявить победителя');
      }
    }
    // Закрытые опросы ещё час доступны через GET, потом удаляем.
    const cleanup = setTimeout(() => this.polls.delete(pollId), 60 * 60 * 1000);
    cleanup.unref?.();
    return results;
  }

  /** Таймер на 10 минут: по истечении подводит итоги сам. */
  armTimer(pollId: string, announce: Announce): void {
    this.clearTimer(pollId);
    const poll = this.polls.get(pollId);
    if (!poll) return;
    const wait = Math.max(poll.createdAt + POLL_TTL_MS - Date.now(), 0);
    const timer = setTimeout(() => {
      this.timers.delete(pollId);
      void this.finish(pollId, announce);
    }, wait);
    timer.unref?.();
    this.timers.set(pollId, timer);
  }

  /** Проверить досрочное закрытие (все проголосовали). */
  async maybeFinish(pollId: string, announce: Announce): Promise<void> {
    const poll = this.polls.get(pollId);
    if (poll && shouldFinish(poll)) await this.finish(pollId, announce);
  }

  private clearTimer(pollId: string): void {
    const timer = this.timers.get(pollId);
    if (timer) clearTimeout(timer);
    this.timers.delete(pollId);
  }

  /** Для graceful shutdown и тестов. */
  clearAll(): void {
    for (const timer of this.timers.values()) clearTimeout(timer);
    this.timers.clear();
    this.polls.clear();
  }
}

export const polls = new PollStore();
