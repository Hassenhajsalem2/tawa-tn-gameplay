import { NumberCard, SpecialCard, ChallengeCard, FunnyCard, CardColor, GameCard } from '@/types/game';

// ============================================================
// NUMBER CARDS (40 total: 1-10 in 4 colors)
// ============================================================
const colors: CardColor[] = ['red', 'blue', 'green', 'yellow'];

export function createNumberCards(): NumberCard[] {
  const cards: NumberCard[] = [];
  let idx = 0;
  for (const color of colors) {
    for (let n = 1; n <= 10; n++) {
      cards.push({
        id: `num-${idx++}`,
        type: 'number',
        number: n,
        color,
      });
    }
  }
  return cards;
}

// ============================================================
// SPECIAL CARDS (16 total)
// ============================================================
export function createSpecialCards(): SpecialCard[] {
  const specials: SpecialCard[] = [
    {
      id: 'sp-1a',
      type: 'special',
      name: 'peek_swap',
      displayName: 'Peek & Swap',
      tunisianName: 'Chouf w Baddel',
      icon: '👀',
      effect: 'Look at a card from an opponent and swap it with one of yours if you want',
    },
    {
      id: 'sp-1b',
      type: 'special',
      name: 'peek_swap',
      displayName: 'Peek & Swap',
      tunisianName: 'Chouf w Baddel',
      icon: '👀',
      effect: 'Look at a card from an opponent and swap it with one of yours if you want',
    },
    {
      id: 'sp-2',
      type: 'special',
      name: 'shuffle',
      displayName: 'Shuffle',
      tunisianName: 'Machki w 3awed',
      icon: '🔀',
      effect: 'Choose one opponent to shuffle all their cards',
    },
    {
      id: 'sp-3',
      type: 'special',
      name: 'always_look',
      displayName: 'Always Look',
      tunisianName: '7el 3inek',
      icon: '👁️',
      effect: 'Look at all your own cards (improves memory)',
    },
    {
      id: 'sp-4',
      type: 'special',
      name: 'as_i_wish',
      displayName: 'As I Wish',
      tunisianName: '3la Kifi',
      icon: '✨',
      effect: "Pick an opponent; choose one of their cards and decide if they keep it",
    },
    {
      id: 'sp-5',
      type: 'special',
      name: 'play_again',
      displayName: 'Play Again',
      tunisianName: '3awed Ejbed',
      icon: '🔄',
      effect: 'Skip one entire round for all other players; you draw again',
    },
    {
      id: 'sp-6a',
      type: 'special',
      name: 'blocked',
      displayName: 'Blocked',
      tunisianName: 'Mamnou3',
      icon: '🚫',
      effect: 'Choose an opponent who will be blocked from drawing next turn',
    },
    {
      id: 'sp-6b',
      type: 'special',
      name: 'blocked',
      displayName: 'Blocked',
      tunisianName: 'Mamnou3',
      icon: '🚫',
      effect: 'Choose an opponent who will be blocked from drawing next turn',
    },
    {
      id: 'sp-7',
      type: 'special',
      name: 'pick_from_deck',
      displayName: 'Pick from Deck',
      tunisianName: 'Fripe',
      icon: '🧤',
      effect: 'Choose any card from the deck (look through it)',
    },
    {
      id: 'sp-8',
      type: 'special',
      name: 'pass_it',
      displayName: 'Pass It',
      tunisianName: '3addi',
      icon: '➡️',
      effect: 'Each player passes a card of their choice to the left',
    },
    {
      id: 'sp-9',
      type: 'special',
      name: 'new_challenge',
      displayName: 'New Challenge',
      tunisianName: 'Baddel Challenge',
      icon: '🏆',
      effect: 'Draw a new Challenge card, replacing the current one',
    },
    {
      id: 'sp-10a',
      type: 'special',
      name: 'lucky_seven',
      displayName: 'Lucky Seven',
      tunisianName: "Sab3a el Hayya",
      icon: '7️⃣',
      effect: 'Swap your entire hand with one opponent',
    },
    {
      id: 'sp-10b',
      type: 'special',
      name: 'lucky_seven',
      displayName: 'Lucky Seven',
      tunisianName: "Sab3a el Hayya",
      icon: '7️⃣',
      effect: 'Swap your entire hand with one opponent',
    },
    {
      id: 'sp-11a',
      type: 'special',
      name: 'joker',
      displayName: 'Joker',
      tunisianName: 'Joker',
      icon: '🃏',
      effect: "Can be used as any card OR to counter/cancel another special card's effect",
    },
    {
      id: 'sp-11b',
      type: 'special',
      name: 'joker',
      displayName: 'Joker',
      tunisianName: 'Joker',
      icon: '🃏',
      effect: "Can be used as any card OR to counter/cancel another special card's effect",
    },
    {
      id: 'sp-11c',
      type: 'special',
      name: 'joker',
      displayName: 'Joker',
      tunisianName: 'Joker',
      icon: '🃏',
      effect: "Can be used as any card OR to counter/cancel another special card's effect",
    },
  ];
  return specials;
}

// ============================================================
// CHALLENGE CARDS (16 total)
// ============================================================
export function createChallengeCards(): ChallengeCard[] {
  return [
    { id: 'ch-1', name: 'Mazad', tunisianName: 'Mazad', condition: 'Highest total score wins', points: 20 },
    { id: 'ch-2', name: 'Sidi Bou Saïd', tunisianName: 'Sidi Bou Saïd', condition: 'Total closest to 20 wins', points: 20 },
    { id: 'ch-3', name: 'Carthage', tunisianName: 'Carthage', condition: 'Most cards of the same value wins', points: 25 },
    { id: 'ch-4', name: 'Hrissa', tunisianName: 'Hrissa', condition: 'Most red cards wins', points: 15 },
    { id: 'ch-5', name: 'Sahara', tunisianName: 'Sahara', condition: 'No cards left wins (or lowest count)', points: 30 },
    { id: 'ch-6', name: 'Zitouna', tunisianName: 'Zitouna', condition: 'Most special cards wins', points: 20 },
    { id: 'ch-7', name: 'Arafa', tunisianName: 'Arafa', condition: 'Most odd-numbered cards wins', points: 15 },
    { id: 'ch-8', name: 'E Souk', tunisianName: 'E Souk', condition: 'Most cards numbered 7, 8, 9, 10 wins', points: 20 },
    { id: 'ch-9', name: 'Baldi', tunisianName: 'Baldi', condition: 'Lowest total score wins', points: 20 },
    { id: 'ch-10', name: 'Hafla', tunisianName: 'Hafla', condition: 'Collect a set of consecutive numbers wins', points: 30 },
    { id: 'ch-11', name: 'Waha', tunisianName: 'Waha', condition: 'Most even-numbered cards wins', points: 15 },
    { id: 'ch-12', name: 'Zina w Aziza', tunisianName: 'Zina w Aziza', condition: 'Two pairs of even-numbered cards wins', points: 35 },
    { id: 'ch-13', name: 'Mabrouk', tunisianName: 'Mabrouk', condition: 'Two pairs of odd-numbered cards wins', points: 35 },
    { id: 'ch-14', name: 'Belvedère', tunisianName: 'Belvedère', condition: 'Two pairs: one odd pair + one even pair', points: 40 },
    { id: 'ch-15', name: 'Khomsa', tunisianName: 'Khomsa', condition: 'Most cards under 5 wins', points: 20 },
    { id: 'ch-16', name: 'Masrah', tunisianName: 'Masrah', condition: 'Most cards with all different numbers AND colors', points: 50 },
  ];
}

// ============================================================
// FUNNY CARDS (10 total - punishments for losers)
// ============================================================
export function createFunnyCards(): FunnyCard[] {
  return [
    { id: 'fun-1', name: 'Prank', action: 'Call a random number pretending they won a prize', icon: '📱' },
    { id: 'fun-2', name: 'Call Your Ex', action: 'Call an ex pretending you still love them', icon: '💔' },
    { id: 'fun-3', name: 'Sing a Song', action: 'Sing for 30 seconds (group/winner chooses song)', icon: '🎤' },
    { id: 'fun-4', name: 'Celebrate The Winner', action: 'Buy the winner a drink', icon: '🍹' },
    { id: 'fun-5', name: 'Dance', action: 'Belly dance or silly dance for 15-20 seconds', icon: '💃' },
    { id: 'fun-6', name: 'Story', action: 'Tell an embarrassing personal story', icon: '📖' },
    { id: 'fun-7', name: 'Crush', action: 'Send a date request to someone you like', icon: '💌' },
    { id: 'fun-8', name: 'Push Up', action: 'Do 10 push-ups', icon: '💪' },
    { id: 'fun-9', name: 'Funny Face', action: 'Hold a funny face for 30 seconds', icon: '🤪' },
    { id: 'fun-10', name: 'Tbender', action: 'Shower the winner with dramatic compliments', icon: '👏' },
  ];
}

// ============================================================
// CREATE FULL DECK
// ============================================================
export function createFullDeck(): GameCard[] {
  return [...createNumberCards(), ...createSpecialCards()];
}

export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
