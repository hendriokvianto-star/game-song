import { Card } from './types';
import { isSequenceComplete } from './combinations';

const VALUE_TO_RANK: Record<number, string> = {
  2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7',
  8: '8', 9: '9', 10: '10', 11: 'J', 12: 'Q', 13: 'K', 14: 'A',
};

const SUIT_SYMBOLS: Record<string, string> = {
  hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠', none: '★',
};

export interface SequenceHint {
  canAddLeft: string | null;
  canAddRight: string | null;
  suit: string;
  suitSymbol: string;
}

export function getSequenceHints(sequence: Card[]): SequenceHint {
  const regulars = sequence.filter(c => !c.isJoker);

  if (regulars.length === 0) {
    return { canAddLeft: null, canAddRight: null, suit: 'none', suitSymbol: '★' };
  }

  const suit = regulars[0].suit;
  const suitSymbol = SUIT_SYMBOLS[suit] || '?';
  
  if (isSequenceComplete(sequence)) {
    return { canAddLeft: null, canAddRight: null, suit, suitSymbol };
  }

  // Calculate effective range including Joker positions
  const sorted = [...regulars].sort((a, b) => a.value - b.value);
  const minRegVal = sorted[0].value;
  const totalLen = sequence.length;

  // The effective range covers totalLen consecutive values starting from the lowest
  const effectiveMin = minRegVal;
  const effectiveMax = minRegVal + totalLen - 1;

  // What can be added to the left (lower value)
  const leftVal = effectiveMin - 1;
  const canAddLeft = leftVal >= 2 ? `${VALUE_TO_RANK[leftVal] || leftVal}${suitSymbol}` : null;

  // What can be added to the right (higher value)
  const rightVal = effectiveMax + 1;
  const maxAllowedRight = suit === 'spades' ? 13 : 14;
  const canAddRight = rightVal <= maxAllowedRight ? `${VALUE_TO_RANK[rightVal] || rightVal}${suitSymbol}` : null;

  return { canAddLeft, canAddRight, suit, suitSymbol };
}
