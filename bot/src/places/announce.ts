import { sendMessage } from '../max-api';
import type { Poll, PollResults } from './poll';
import { findPlace, renderPollResults } from './service';

// Объявление победителя в чате, когда опрос закрылся.
export async function announcePollWinner(poll: Poll, results: PollResults): Promise<void> {
  const winnerName = results.winnerPlaceId ? (findPlace(results.winnerPlaceId)?.name ?? null) : null;
  await sendMessage(poll.chatId, renderPollResults(results.options, winnerName));
}
