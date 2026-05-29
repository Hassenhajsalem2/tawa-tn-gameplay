// ============================================================
// TAWA Game Types
// ============================================================

export type CardColor = 'red' | 'blue' | 'green' | 'yellow';

export interface NumberCard {
  id: string;
  type: 'number';
  number: number;
  color: CardColor;
}

export type SpecialName =
  | 'peek_swap'
  | 'shuffle'
  | 'always_look'
  | 'as_i_wish'
  | 'play_again'
  | 'blocked'
  | 'pick_from_deck'
  | 'pass_it'
  | 'new_challenge'
  | 'lucky_seven'
  | 'joker';

export interface SpecialCard {
  id: string;
  type: 'special';
  name: SpecialName;
  displayName: string;
  tunisianName: string;
  icon: string;
  effect: string;
}

export type GameCard = NumberCard | SpecialCard;

export interface ChallengeCard {
  id: string;
  name: string;
  tunisianName: string;
  condition: string;
  points: number;
}

export interface FunnyCard {
  id: string;
  name: string;
  action: string;
  icon: string;
}

export type GamePhase =
  | 'lobby'
  | 'draw_challenge'
  | 'choice_circle'
  | 'playing'
  | 'tawa_called'
  | 'round_end'
  | 'game_end';

export type VisibilityMode = 'reveal_all' | 'reveal_two' | 'keep_hidden';

export interface Player {
  id: string;
  name: string;
  isBot: boolean;
  isHost: boolean;
  isReady: boolean;
  hand: GameCard[];
  score: number;
  isBlocked: boolean;
  canSeeOwnCards: boolean;
  revealedCardIds: string[];
  connected: boolean;
}

export interface EffectAction {
  type: SpecialName | 'none';
  sourcePlayerId: string;
  targetPlayerId?: string;
  targetCardIndex?: number;
  sourceCardIndex?: number;
  resolved: boolean;
}

export interface GameState {
  roomId: string;
  phase: GamePhase;
  players: Player[];
  currentPlayerIndex: number;
  drawPile: GameCard[];
  discardPile: GameCard[];
  currentChallenge: ChallengeCard | null;
  challengeDeck: ChallengeCard[];
  funnyCards: FunnyCard[];
  visibilityMode: VisibilityMode;
  round: number;
  maxRounds: number;
  pendingEffect: EffectAction | null;
  drawnCard: GameCard | null;
  hasDrawn: boolean;
  hasDiscarded: boolean;
  tawaCallerId: string | null;
  winner: string | null;
  roundWinner: string | null;
  funnyCardResult: FunnyCard | null;
  message: string;
  turnTimer: number;
  animatingCard: string | null;
  showDeckBrowser: boolean;
  passItPending: boolean;
  passItSelections: Record<string, number>;
  jokerReactionWindow: boolean;
  jokerReactingPlayerId: string | null;
  votingInProgress: boolean;
  votes: Record<string, VisibilityMode>;
}
