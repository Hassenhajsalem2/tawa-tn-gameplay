export type CardColor = 'red' | 'blue' | 'green' | 'yellow';

export interface NumberCard {
  id: string;
  type: 'number';
  number: number;
  color: CardColor;
}

export interface SpecialCard {
  id: string;
  type: 'special';
  name: string;
  displayName: string;
  tunisianName: string;
  icon: string;
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
  icon: string;
  action: string;
}

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

export type VisibilityMode = 'reveal_all' | 'reveal_two' | 'keep_hidden';

export type GamePhase =
  | 'lobby'
  | 'draw_challenge'
  | 'playing'
  | 'tawa_called'
  | 'round_end'
  | 'game_end';

export interface PendingEffect {
  type: string;
  sourcePlayerId: string;
  resolved: boolean;
}

export interface GameState {
  roomId: string | null;
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
  pendingEffect: PendingEffect | null;
  drawnCard: GameCard | null;
  hasDrawn: boolean;
  hasDiscarded: boolean;
  tawaCallerId: string | null;
  winner: string | null;
  roundWinner: string | null;
  funnyCardResult: FunnyCard | null;
  message: string;
  turnTimer: number | null;
  animatingCard: string | null;
  showDeckBrowser: boolean;
  passItPending: boolean;
  passItSelections: Record<string, number>;
  jokerReactionWindow: boolean;
  jokerReactingPlayerId: string | null;
  votingInProgress: boolean;
  votes: Record<string, string>;
}
