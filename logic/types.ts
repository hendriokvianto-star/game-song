export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades' | 'none';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A' | 'Joker';

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  value: number;
  isJoker?: boolean;
  isDead?: boolean; // Flag for a Joker that has killed a SameValueCombo
}

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  isAI: boolean;
  finishedOrder?: number; // 1st, 2nd, 3rd... to finish
  hasOpened?: boolean; 
  openingValue?: number;
  totalScore: number; // Accumulated points across rounds
  pointsGainedThisRound?: number; // Last round performance
  difficulty?: 'easy' | 'normal' | 'expert';
}

export interface GameState {
  deck: Card[];
  discardPile: Card[];
  players: Player[];
  currentPlayerIndex: number;
  direction: 1 | -1;
  status: 'idle' | 'opening' | 'dealing' | 'playing' | 'finished';
  winnerId?: string;
  finishCount: number;
  allPlayersOpened?: boolean;
  currentRound: number;
  lastFinishingMeld?: Card[]; // The cards that ended the round
  matchWinnerId?: string; // Winner of the 500-point match
  ceremonyWinnerId?: string; // Player triggering the ceremonial win
}
