import { v4 as uuidv4 } from 'uuid';
import {
  GameState,
  Player,
  GameCard,
  SpecialCard,
  VisibilityMode,
} from '@/types/game';
import {
  createFullDeck,
  createChallengeCards,
  createFunnyCards,
  shuffleArray,
} from '@/data/cards';
import { validateTawaCall } from './challengeValidator';

const BOT_NAMES = ['Aziz 🇹🇳', 'Yasmine 🌸', 'Khalil 🎯', 'Meriem ⭐', 'Nour 🌙'];

export function createInitialState(playerName: string, botCount: number = 2, roomId?: string): GameState {
  const playerId = 'player-human';
  const players: Player[] = [
    {
      id: playerId,
      name: playerName,
      isBot: false,
      isHost: true,
      isReady: true,
      hand: [],
      score: 0,
      isBlocked: false,
      canSeeOwnCards: false,
      revealedCardIds: [],
      connected: true,
    },
  ];

  const usedNames = shuffleArray(BOT_NAMES);
  for (let i = 0; i < Math.min(botCount, 5); i++) {
    players.push({
      id: `bot-${i}`,
      name: usedNames[i],
      isBot: true,
      isHost: false,
      isReady: true,
      hand: [],
      score: 0,
      isBlocked: false,
      canSeeOwnCards: false,
      revealedCardIds: [],
      connected: true,
    });
  }

  return {
    roomId: roomId || uuidv4().slice(0, 6).toUpperCase(),
    phase: 'lobby',
    players,
    currentPlayerIndex: 0,
    drawPile: [],
    discardPile: [],
    currentChallenge: null,
    challengeDeck: shuffleArray(createChallengeCards()),
    funnyCards: createFunnyCards(),
    visibilityMode: 'keep_hidden',
    round: 0,
    maxRounds: 5,
    pendingEffect: null,
    drawnCard: null,
    hasDrawn: false,
    hasDiscarded: false,
    tawaCallerId: null,
    winner: null,
    roundWinner: null,
    funnyCardResult: null,
    message: 'Welcome to TAWA! 🔥',
    turnTimer: 30,
    animatingCard: null,
    showDeckBrowser: false,
    passItPending: false,
    passItSelections: {},
    jokerReactionWindow: false,
    jokerReactingPlayerId: null,
    votingInProgress: false,
    votes: {},
  };
}

export function startNewRound(state: GameState): GameState {
  const deck = shuffleArray(createFullDeck());
  const newRound = state.round + 1;

  // Deal 4 cards to each player
  const players = state.players.map(p => ({
    ...p,
    hand: [] as GameCard[],
    isBlocked: false,
    canSeeOwnCards: false,
    revealedCardIds: [],
  }));

  let deckIndex = 0;
  for (const player of players) {
    player.hand = deck.slice(deckIndex, deckIndex + 4);
    deckIndex += 4;
  }

  const drawPile = deck.slice(deckIndex);

  // Draw challenge
  let challengeDeck = [...state.challengeDeck];
  if (challengeDeck.length === 0) {
    challengeDeck = shuffleArray(createChallengeCards());
  }
  const currentChallenge = challengeDeck[0];
  challengeDeck = challengeDeck.slice(1);

  return {
    ...state,
    phase: 'draw_challenge',
    players,
    currentPlayerIndex: 0,
    drawPile,
    discardPile: [],
    currentChallenge,
    challengeDeck,
    round: newRound,
    drawnCard: null,
    hasDrawn: false,
    hasDiscarded: false,
    pendingEffect: null,
    tawaCallerId: null,
    roundWinner: null,
    funnyCardResult: null,
    message: `Round ${newRound} — Challenge: ${currentChallenge.name}!`,
    visibilityMode: 'keep_hidden',
    showDeckBrowser: false,
    passItPending: false,
    passItSelections: {},
    jokerReactionWindow: false,
    jokerReactingPlayerId: null,
    votingInProgress: false,
    votes: {},
  };
}

export function setVisibilityMode(state: GameState, mode: VisibilityMode): GameState {
  const players = state.players.map(p => {
    const newPlayer = { ...p, revealedCardIds: [] as string[] };
    if (mode === 'reveal_all') {
      newPlayer.revealedCardIds = p.hand.map(c => c.id);
      newPlayer.canSeeOwnCards = true;
    } else if (mode === 'reveal_two') {
      const shuffled = shuffleArray([...p.hand]);
      newPlayer.revealedCardIds = shuffled.slice(0, 2).map(c => c.id);
    }
    return newPlayer;
  });

  return {
    ...state,
    phase: 'playing',
    visibilityMode: mode,
    players,
    message: `Game on! ${mode === 'reveal_all' ? 'All cards revealed!' : mode === 'reveal_two' ? '2 cards revealed per player!' : 'All cards hidden!'}`,
  };
}

export function drawCard(state: GameState): GameState {
  const currentPlayer = state.players[state.currentPlayerIndex];
  if (state.hasDrawn) return state;
  if (currentPlayer.isBlocked) {
    // Blocked: mark hasDrawn=true and drawnCard=null (no card drawn).
    // The caller (botTurn or performDraw in store) is responsible for calling nextTurn.
    return {
      ...state,
      hasDrawn: true,
      drawnCard: null,
      players: state.players.map(p =>
        p.id === currentPlayer.id ? { ...p, isBlocked: false } : p
      ),
      message: `${currentPlayer.name} is BLOCKED! 🚫 Turn skipped.`,
    };
  }

  if (state.drawPile.length === 0) {
    if (state.discardPile.length === 0) {
      // Both piles empty - create fresh cards
      const freshDeck = shuffleArray(createFullDeck());
      return {
        ...state,
        drawPile: freshDeck.slice(1),
        drawnCard: freshDeck[0],
        hasDrawn: true,
        message: `${currentPlayer.name} draws a card! (New deck created)`,
      };
    }
    // Reshuffle discard pile
    const reshuffled = shuffleArray(state.discardPile);
    return {
      ...state,
      drawPile: reshuffled.slice(1),
      discardPile: [],
      drawnCard: reshuffled[0],
      hasDrawn: true,
      message: `${currentPlayer.name} draws a card! (Deck reshuffled)`,
    };
  }

  const drawnCard = state.drawPile[0];
  const newDrawPile = state.drawPile.slice(1);

  return {
    ...state,
    drawPile: newDrawPile,
    drawnCard,
    hasDrawn: true,
    message: `${currentPlayer.name} draws a card!`,
  };
}

export function discardCard(state: GameState, cardIndex: number): GameState {
  const currentPlayer = state.players[state.currentPlayerIndex];
  const drawnCard = state.drawnCard;
  if (!drawnCard) return state;

  // Player has 4 cards in hand + 1 drawn card
  // They choose which of their hand cards (or the drawn card) to discard
  // cardIndex = -1 means discard the drawn card
  // cardIndex >= 0 means discard hand[cardIndex] and keep drawn card

  let discardedCard: GameCard;
  let newHand: GameCard[];

  if (cardIndex === -1) {
    // Discard drawn card
    discardedCard = drawnCard;
    newHand = [...currentPlayer.hand];
  } else {
    // Replace hand card with drawn card
    discardedCard = currentPlayer.hand[cardIndex];
    newHand = [...currentPlayer.hand];
    newHand[cardIndex] = drawnCard;
  }

  const newDiscardPile = [discardedCard, ...state.discardPile];

  const newPlayers = state.players.map(p =>
    p.id === currentPlayer.id ? { ...p, hand: newHand } : p
  );

  // Check if discarded card is special
  if (discardedCard.type === 'special') {
    const special = discardedCard as SpecialCard;
    return {
      ...state,
      players: newPlayers,
      discardPile: newDiscardPile,
      drawnCard: null,
      hasDiscarded: true,
      pendingEffect: {
        type: special.name,
        sourcePlayerId: currentPlayer.id,
        resolved: false,
      },
      message: `${currentPlayer.name} plays ${special.icon} ${special.displayName}!`,
    };
  }

  return {
    ...state,
    players: newPlayers,
    discardPile: newDiscardPile,
    drawnCard: null,
    hasDiscarded: true,
    message: `${currentPlayer.name} discards a card.`,
  };
}

export function resolveEffect(state: GameState, targetPlayerId?: string, targetCardIndex?: number, accept?: boolean): GameState {
  const effect = state.pendingEffect;
  if (!effect) return nextTurn(state);

  const sourcePlayer = state.players.find(p => p.id === effect.sourcePlayerId)!;
  let newState = { ...state };

  switch (effect.type) {
    case 'peek_swap': {
      if (!targetPlayerId) return nextTurn({ ...state, pendingEffect: null });
      const target = state.players.find(p => p.id === targetPlayerId)!;
      if (targetCardIndex === undefined) return nextTurn({ ...state, pendingEffect: null });
      if (accept) {
        // Swap: source gets target's card, target gets source's first card
        const sourceCardIdx = 0;
        const newPlayers = state.players.map(p => {
          if (p.id === sourcePlayer.id) {
            const hand = [...p.hand];
            hand[sourceCardIdx] = target.hand[targetCardIndex];
            return { ...p, hand };
          }
          if (p.id === targetPlayerId) {
            const hand = [...p.hand];
            hand[targetCardIndex] = sourcePlayer.hand[0];
            return { ...p, hand };
          }
          return p;
        }) as Player[];
        newState = { ...state, players: newPlayers, message: `${sourcePlayer.name} swaps a card with ${target.name}!` };
      } else {
        newState = { ...state, message: `${sourcePlayer.name} peeks but doesn't swap.` };
      }
      break;
    }

    case 'shuffle': {
      if (!targetPlayerId) return nextTurn({ ...state, pendingEffect: null });
      const newPlayers = state.players.map(p =>
        p.id === targetPlayerId
          ? { ...p, hand: shuffleArray(p.hand), revealedCardIds: [] }
          : p
      );
      const target = state.players.find(p => p.id === targetPlayerId)!;
      newState = { ...state, players: newPlayers, message: `${target.name}'s hand is shuffled! 🔀` };
      break;
    }

    case 'always_look': {
      const newPlayers = state.players.map(p =>
        p.id === sourcePlayer.id
          ? { ...p, canSeeOwnCards: true, revealedCardIds: p.hand.map(c => c.id) }
          : p
      );
      newState = { ...state, players: newPlayers, message: `${sourcePlayer.name} can now see all their cards! 👁️` };
      break;
    }

    case 'as_i_wish': {
      if (!targetPlayerId) return nextTurn({ ...state, pendingEffect: null });
      if (targetCardIndex === undefined) return nextTurn({ ...state, pendingEffect: null });
      const target = state.players.find(p => p.id === targetPlayerId)!;
      if (!accept) {
        // Remove the card from target
        const newPlayers = state.players.map(p => {
          if (p.id === targetPlayerId) {
            const hand = p.hand.filter((_, i) => i !== targetCardIndex);
            return { ...p, hand };
          }
          return p;
        });
        newState = { ...state, players: newPlayers, message: `${sourcePlayer.name} removes a card from ${target.name}! ✨` };
      } else {
        newState = { ...state, message: `${sourcePlayer.name} lets ${target.name} keep the card.` };
      }
      break;
    }

    case 'play_again': {
      // Current player gets another turn (reset so they can draw again)
      return {
        ...state,
        pendingEffect: null,
        hasDrawn: false,
        hasDiscarded: false,
        drawnCard: null,
        message: `${sourcePlayer.name} plays again! 🔄`,
      };
    }

    case 'blocked': {
      if (!targetPlayerId) return nextTurn({ ...state, pendingEffect: null });
      const target = state.players.find(p => p.id === targetPlayerId)!;
      const newPlayers = state.players.map(p =>
        p.id === targetPlayerId ? { ...p, isBlocked: true } : p
      );
      newState = { ...state, players: newPlayers, message: `${target.name} is BLOCKED next turn! 🚫` };
      break;
    }

    case 'pick_from_deck': {
      if (targetCardIndex === undefined) return nextTurn({ ...state, pendingEffect: null });
      const pickedCard = state.drawPile[targetCardIndex];
      if (!pickedCard) return nextTurn({ ...state, pendingEffect: null });
      // Replace worst card in hand (or first)
      const newDrawPile = state.drawPile.filter((_, i) => i !== targetCardIndex);
      const removedCard = sourcePlayer.hand[0];
      const newPlayers = state.players.map(p => {
        if (p.id === sourcePlayer.id) {
          const hand = [...p.hand];
          hand[0] = pickedCard;
          return { ...p, hand };
        }
        return p;
      });
      newState = {
        ...state,
        players: newPlayers,
        drawPile: [...newDrawPile, removedCard],
        showDeckBrowser: false,
        message: `${sourcePlayer.name} picks a card from the deck! 🧤`,
      };
      break;
    }

    case 'pass_it': {
      // Each player passes a card to the left
      const n = state.players.length;
      const passedCards: GameCard[] = state.players.map((p, _i) => {
        const idx = state.passItSelections[p.id] ?? 0;
        return p.hand[idx];
      });

      const newPlayers = state.players.map((p, i) => {
        const receiveFrom = (i - 1 + n) % n;
        const giveIdx = state.passItSelections[p.id] ?? 0;
        const hand = [...p.hand];
        hand[giveIdx] = passedCards[receiveFrom];
        return { ...p, hand };
      });

      newState = { ...state, players: newPlayers, passItPending: false, passItSelections: {}, message: 'Everyone passed a card to the left! ➡️' };
      break;
    }

    case 'new_challenge': {
      let challengeDeck = [...state.challengeDeck];
      if (challengeDeck.length === 0) {
        challengeDeck = shuffleArray(createChallengeCards());
      }
      const newChallenge = challengeDeck[0];
      challengeDeck = challengeDeck.slice(1);
      newState = {
        ...state,
        currentChallenge: newChallenge,
        challengeDeck,
        message: `New Challenge: ${newChallenge.name}! 🏆`,
      };
      break;
    }

    case 'lucky_seven': {
      if (!targetPlayerId) return nextTurn({ ...state, pendingEffect: null });
      const target = state.players.find(p => p.id === targetPlayerId)!;
      const sourceHand = [...sourcePlayer.hand];
      const targetHand = [...target.hand];
      const newPlayers = state.players.map(p => {
        if (p.id === sourcePlayer.id) return { ...p, hand: targetHand, revealedCardIds: [] };
        if (p.id === targetPlayerId) return { ...p, hand: sourceHand, revealedCardIds: [] };
        return p;
      });
      newState = { ...state, players: newPlayers, message: `${sourcePlayer.name} swaps entire hand with ${target.name}! 7️⃣` };
      break;
    }

    case 'joker': {
      // Joker used as cancel - already handled
      newState = { ...state, message: `${sourcePlayer.name} plays Joker! 🃏` };
      break;
    }

    default:
      break;
  }

  return nextTurn({ ...newState, pendingEffect: null });
}

export function nextTurn(state: GameState): GameState {
  const n = state.players.length;
  let nextIndex = (state.currentPlayerIndex + 1) % n;

  // Skip and auto-unblock any blocked player in the rotation
  // (guarded by loop limit to prevent infinite loop if all are blocked)
  let loopGuard = 0;
  while (state.players[nextIndex]?.isBlocked && loopGuard < n) {
    const unblocked = state.players.map((p, i) =>
      i === nextIndex ? { ...p, isBlocked: false } : p
    );
    state = { ...state, players: unblocked };
    nextIndex = (nextIndex + 1) % n;
    loopGuard++;
  }

  return {
    ...state,
    currentPlayerIndex: nextIndex,
    hasDrawn: false,
    hasDiscarded: false,
    drawnCard: null,
    pendingEffect: null,
    showDeckBrowser: false,
    message: `${state.players[nextIndex].name}'s turn`,
  };
}

export function callTawa(state: GameState, callerId: string): GameState {
  const caller = state.players.find(p => p.id === callerId)!;
  const challenge = state.currentChallenge!;

  const isValid = validateTawaCall(challenge, caller, state.players);

  if (isValid) {
    const newPlayers = state.players.map(p =>
      p.id === callerId
        ? { ...p, score: p.score + challenge.points }
        : p
    );

    return {
      ...state,
      phase: 'tawa_called',
      players: newPlayers,
      tawaCallerId: callerId,
      roundWinner: callerId,
      message: `🔥 TAWA! ${caller.name} wins the round! +${challenge.points} points!`,
    };
  } else {
    // Invalid TAWA - penalty
    const funnyCard = state.funnyCards[Math.floor(Math.random() * state.funnyCards.length)];
    const newPlayers = state.players.map(p =>
      p.id === callerId ? { ...p, score: Math.max(0, p.score - 10) } : p
    );

    return {
      ...state,
      phase: 'tawa_called',
      players: newPlayers,
      tawaCallerId: callerId,
      roundWinner: null,
      funnyCardResult: funnyCard,
      message: `❌ Invalid TAWA! ${caller.name} loses 10 points and gets a punishment!`,
    };
  }
}

export function endRound(state: GameState): GameState {
  if (state.round >= state.maxRounds) {
    // Game over
    const sortedPlayers = [...state.players].sort((a, b) => b.score - a.score);
    return {
      ...state,
      phase: 'game_end',
      winner: sortedPlayers[0].id,
      message: `🏆 Game Over! ${sortedPlayers[0].name} wins with ${sortedPlayers[0].score} points!`,
    };
  }

  return {
    ...state,
    phase: 'round_end',
    funnyCardResult: null,
    message: `Round ${state.round} complete! Get ready for the next round...`,
  };
}

// Bot AI logic
export function botTurn(state: GameState): GameState {
  const currentPlayer = state.players[state.currentPlayerIndex];
  if (!currentPlayer.isBot) return state;

  // Step 1: Draw
  let newState = drawCard(state);

  // Step 2: Decide what to discard
  // If drawnCard is null after drawCard, the player was blocked — advance turn.
  // Note: drawCard sets hasDrawn=true when blocked, so we check hasDrawn+no drawnCard.
  if (newState.hasDrawn && !newState.drawnCard) {
    return nextTurn(newState);
  }

  // Simple bot logic: keep lower valued number cards for most challenges
  // Discard drawn card or worst hand card
  const drawnCard = newState.drawnCard!;

  if (drawnCard.type === 'special') {
    // 50% chance to play the special card
    if (Math.random() < 0.5) {
      newState = discardCard(newState, -1); // discard the special (trigger effect)
      // Auto-resolve bot effects
      if (newState.pendingEffect) {
        const otherPlayers = newState.players.filter(p => p.id !== currentPlayer.id);
        const randomTarget = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];

        switch (newState.pendingEffect.type) {
          case 'peek_swap':
          case 'shuffle':
          case 'blocked':
          case 'lucky_seven':
            return resolveEffect(newState, randomTarget?.id, 0, Math.random() > 0.5);
          case 'as_i_wish':
            return resolveEffect(newState, randomTarget?.id, 0, Math.random() > 0.5);
          case 'always_look':
          case 'new_challenge':
          case 'joker':
            return resolveEffect(newState);
          case 'play_again':
            return resolveEffect(newState);
          case 'pick_from_deck':
            return resolveEffect(newState, undefined, Math.floor(Math.random() * Math.min(5, newState.drawPile.length)));
          case 'pass_it': {
            const selections: Record<string, number> = {};
            newState.players.forEach(p => {
              selections[p.id] = Math.floor(Math.random() * p.hand.length);
            });
            return resolveEffect({ ...newState, passItSelections: selections });
          }
          default:
            return nextTurn(newState);
        }
      }
      return nextTurn(newState);
    }
  }

  // Find worst card to discard (highest number for "lowest total" or use simple heuristic)
  let worstIdx = -1; // -1 means discard drawn
  let worstValue = drawnCard.type === 'number' ? drawnCard.number : 0;

  currentPlayer.hand.forEach((card, idx) => {
    if (card.type === 'number' && card.number > worstValue) {
      worstValue = card.number;
      worstIdx = idx;
    }
  });

  newState = discardCard(newState, worstIdx);

  if (newState.pendingEffect) {
    return nextTurn({ ...newState, pendingEffect: null });
  }

  // Small chance bot calls TAWA
  if (Math.random() < 0.05 && newState.round > 0) {
    return callTawa(newState, currentPlayer.id);
  }

  return nextTurn(newState);
}
