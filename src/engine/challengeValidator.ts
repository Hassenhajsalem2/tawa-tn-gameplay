import { ChallengeCard, GameCard, NumberCard, Player } from '@/types/game';

function getNumberCards(hand: GameCard[]): NumberCard[] {
  return hand.filter((c): c is NumberCard => c.type === 'number');
}

function getTotal(hand: GameCard[]): number {
  return getNumberCards(hand).reduce((sum, c) => sum + c.number, 0);
}

function countRedCards(hand: GameCard[]): number {
  return getNumberCards(hand).filter(c => c.color === 'red').length;
}

function countSpecialCards(hand: GameCard[]): number {
  return hand.filter(c => c.type === 'special').length;
}

function countOddCards(hand: GameCard[]): number {
  return getNumberCards(hand).filter(c => c.number % 2 !== 0).length;
}

function countEvenCards(hand: GameCard[]): number {
  return getNumberCards(hand).filter(c => c.number % 2 === 0).length;
}

function countHighCards(hand: GameCard[]): number {
  return getNumberCards(hand).filter(c => c.number >= 7 && c.number <= 10).length;
}

function countUnder5(hand: GameCard[]): number {
  return getNumberCards(hand).filter(c => c.number < 5).length;
}

function maxSameValue(hand: GameCard[]): number {
  const nums = getNumberCards(hand);
  const counts: Record<number, number> = {};
  nums.forEach(c => { counts[c.number] = (counts[c.number] || 0) + 1; });
  return Math.max(0, ...Object.values(counts));
}

function longestConsecutive(hand: GameCard[]): number {
  const nums = [...new Set(getNumberCards(hand).map(c => c.number))].sort((a, b) => a - b);
  if (nums.length === 0) return 0;
  let maxLen = 1, curLen = 1;
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] === nums[i - 1] + 1) {
      curLen++;
      maxLen = Math.max(maxLen, curLen);
    } else {
      curLen = 1;
    }
  }
  return maxLen;
}

function countEvenPairs(hand: GameCard[]): number {
  const evens = getNumberCards(hand).filter(c => c.number % 2 === 0);
  const counts: Record<number, number> = {};
  evens.forEach(c => { counts[c.number] = (counts[c.number] || 0) + 1; });
  return Object.values(counts).filter(c => c >= 2).length;
}

function countOddPairs(hand: GameCard[]): number {
  const odds = getNumberCards(hand).filter(c => c.number % 2 !== 0);
  const counts: Record<number, number> = {};
  odds.forEach(c => { counts[c.number] = (counts[c.number] || 0) + 1; });
  return Object.values(counts).filter(c => c >= 2).length;
}

function allDifferentScore(hand: GameCard[]): number {
  const nums = getNumberCards(hand);
  const uniqueNumbers = new Set(nums.map(c => c.number));
  const uniqueColors = new Set(nums.map(c => c.color));
  return uniqueNumbers.size + uniqueColors.size;
}

export function evaluateChallenge(challenge: ChallengeCard, players: Player[]): string | null {
  if (players.length === 0) return null;

  type Scorer = (p: Player) => number;
  let scorer: Scorer;
  let higherIsBetter = true;

  switch (challenge.id) {
    case 'ch-1': // Highest total
      scorer = p => getTotal(p.hand);
      break;
    case 'ch-2': // Closest to 20
      scorer = p => -Math.abs(getTotal(p.hand) - 20);
      break;
    case 'ch-3': // Most cards same value
      scorer = p => maxSameValue(p.hand);
      break;
    case 'ch-4': // Most red
      scorer = p => countRedCards(p.hand);
      break;
    case 'ch-5': // Fewest cards (Sahara)
      scorer = p => p.hand.length;
      higherIsBetter = false;
      break;
    case 'ch-6': // Most special cards
      scorer = p => countSpecialCards(p.hand);
      break;
    case 'ch-7': // Most odd
      scorer = p => countOddCards(p.hand);
      break;
    case 'ch-8': // Most 7,8,9,10
      scorer = p => countHighCards(p.hand);
      break;
    case 'ch-9': // Lowest total
      scorer = p => getTotal(p.hand);
      higherIsBetter = false;
      break;
    case 'ch-10': // Consecutive
      scorer = p => longestConsecutive(p.hand);
      break;
    case 'ch-11': // Most even
      scorer = p => countEvenCards(p.hand);
      break;
    case 'ch-12': // Two pairs of even
      scorer = p => countEvenPairs(p.hand);
      break;
    case 'ch-13': // Two pairs of odd
      scorer = p => countOddPairs(p.hand);
      break;
    case 'ch-14': // One odd pair + one even pair
      scorer = p => Math.min(countOddPairs(p.hand), 1) + Math.min(countEvenPairs(p.hand), 1);
      break;
    case 'ch-15': // Most under 5
      scorer = p => countUnder5(p.hand);
      break;
    case 'ch-16': // All different numbers AND colors
      scorer = p => allDifferentScore(p.hand);
      break;
    default:
      scorer = p => getTotal(p.hand);
  }

  let bestScore = higherIsBetter ? -Infinity : Infinity;
  let winnerId: string | null = null;

  for (const p of players) {
    const score = scorer(p);
    if ((higherIsBetter && score > bestScore) || (!higherIsBetter && score < bestScore)) {
      bestScore = score;
      winnerId = p.id;
    }
  }

  return winnerId;
}

export function validateTawaCall(challenge: ChallengeCard, caller: Player, players: Player[]): boolean {
  const winnerId = evaluateChallenge(challenge, players);
  return winnerId === caller.id;
}
