export const HAND_SIZE = 4;

export function shuffle(array) {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function createDeckState(cards) {
  const s = shuffle(cards);
  return {
    hand: s.slice(0, HAND_SIZE),
    next: s[HAND_SIZE],
    queue: s.slice(HAND_SIZE + 1),
  };
}

export function playCard(state, cardId) {
  const played = state.hand.find((c) => c.id === cardId);
  if (!played) return state;
  const hand = state.hand.map((c) => (c.id === cardId ? state.next : c));
  const queue = [...state.queue, played];
  return { hand, next: queue[0], queue: queue.slice(1) };
}