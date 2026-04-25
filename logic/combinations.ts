import { Card } from './types';

function validateSequenceValues(values: number[], jokerCount: number, maxRange: number): boolean {
  if (values.length === 0) return jokerCount >= 3;
  const sorted = [...values].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  
  // Rule: Total range covered cannot exceed maxRange (13 or 14)
  if (max - min + 1 > maxRange) return false;
  
  let gaps = 0;
  for (let i = 0; i < sorted.length - 1; i++) {
    const diff = sorted[i+1] - sorted[i];
    if (diff === 0) return false; 
    gaps += (diff - 1);
  }
  
  // Total length if we fill all gaps
  const requiredLength = (max - min + 1);
  if (requiredLength > maxRange) return false;

  return jokerCount >= gaps;
}

export const isSequence = (cards: Card[]): boolean => {
  if (cards.length === 0) return false;
  if (cards.length > 13) return false; // A sequence cannot exceed 13 cards (2 to A)
  
  const jokers = cards.filter(c => c.isJoker);
  const regulars = cards.filter(c => !c.isJoker);
  
  if (regulars.length === 0) {
    return cards.length >= 3;
  }
  
  const suit = regulars[0].suit;
  const sameSuit = regulars.every(c => c.suit === suit);
  if (!sameSuit) return false;
  
  const hasAce = regulars.some(c => c.rank === 'A');
  
  // Spades has no regular Ace (Ace of Spades is a Joker), so max range is 12 (2-K)
  const maxRange = suit === 'spades' ? 12 : 14;

  // Test 1: Aces as 14
  const test1 = validateSequenceValues(regulars.map(c => c.value), jokers.length, maxRange);
  if (test1) return true;

  // Test 2: Aces as 1
  if (hasAce && suit !== 'spades') {
    const test2 = validateSequenceValues(regulars.map(c => c.rank === 'A' ? 1 : c.value), jokers.length, 13);
    if (test2) return true;
  }
  
  return false;
};

export const isStrictOrderedSequence = (cards: Card[]): boolean => {
  if (cards.length < 3) return false;
  if (!isSequence(cards)) return false; 
  
  const regulars = cards.filter(c => !c.isJoker);
  if (regulars.length <= 1) return true; 
  
  const hasAce = regulars.some(c => c.rank === 'A');
  
  const testStrict = (useAceAsOne: boolean) => {
    let expectedNextValue: number | null = null;
    let expectedSuit: string | null = null;
    
    for (const c of cards) {
      if (c.isJoker) {
        if (expectedNextValue !== null) expectedNextValue++;
      } else {
        const val = (useAceAsOne && c.rank === 'A') ? 1 : c.value;
        if (expectedSuit === null) expectedSuit = c.suit;
        else if (c.suit !== expectedSuit) return false;
        
        if (expectedNextValue !== null && val !== expectedNextValue) return false;
        expectedNextValue = val + 1;
      }
    }
    return true;
  };

  return testStrict(false) || (hasAce && testStrict(true));
};

export const isSequenceComplete = (seq: Card[]): boolean => {
  if (seq.length === 0) return false;
  if (!isSequence(seq)) return false;
  
  const regulars = seq.filter(c => !c.isJoker);
  if (regulars.length === 0) return false;
  
  const suit = regulars[0].suit;
  if (suit === 'spades') {
    return seq.length >= 12;
  }
  return seq.length >= 13;
};

export const isSameValueCombo = (cards: Card[]): boolean => {
  if (cards.length === 0) return false;
  const regulars = cards.filter(c => !c.isJoker);
  if (regulars.length <= 1) return true; // all jokers or 1 regular + jokers
  
  const val = regulars[0].value;
  return regulars.every(c => c.value === val);
};

export const sortSequence = (cards: Card[]): Card[] => {
  const jokers = cards.filter(c => c.isJoker);
  const regulars = cards.filter(c => !c.isJoker);
  
  if (regulars.length === 0) return jokers;
  
  let useAceAsOne = false;
  const hasAce = regulars.some(c => c.rank === 'A');
  
  if (hasAce) {
    const suit = regulars[0].suit;
    const maxRange = suit === 'spades' ? 12 : 14;
    const valid14 = validateSequenceValues(regulars.map(c => c.value), jokers.length, maxRange);
    const valid1 = validateSequenceValues(regulars.map(c => c.rank === 'A' ? 1 : c.value), jokers.length, 13);
    if (valid1 && !valid14) {
      useAceAsOne = true;
    }
  }
  
  const sortedRegulars = [...regulars].sort((a, b) => {
    const valA = (useAceAsOne && a.rank === 'A') ? 1 : a.value;
    const valB = (useAceAsOne && b.rank === 'A') ? 1 : b.value;
    return valA - valB;
  });
  
  // Find a start value that respects any existing Joker assignments to maintain stability
  let startVal = (useAceAsOne && sortedRegulars[0].rank === 'A') ? 1 : sortedRegulars[0].value;
  const assignedJokers = jokers.filter(j => j.assignedValue !== undefined);
  if (assignedJokers.length > 0) {
    const minAssigned = Math.min(...assignedJokers.map(j => j.assignedValue!));
    // If the joker was assigned a value lower than our first regular card, 
    // try to start the sequence from that joker's value.
    if (minAssigned < startVal && (startVal - minAssigned) <= jokers.length) {
      startVal = minAssigned;
    }
  }

  const result: Card[] = [];
  let currentVal = startVal;
  let regularIdx = 0;
  let jokerIdx = 0;

  while (regularIdx < sortedRegulars.length) {
    const rVal = (useAceAsOne && sortedRegulars[regularIdx].rank === 'A') ? 1 : sortedRegulars[regularIdx].value;
    if (rVal === currentVal) {
      result.push(sortedRegulars[regularIdx]);
      regularIdx++;
    } else {
      if (jokerIdx < jokers.length) {
        result.push(jokers[jokerIdx]);
        jokerIdx++;
      } else {
        break;
      }
    }
    currentVal++;
  }
  
  const suit = sortedRegulars.length > 0 ? sortedRegulars[0].suit : 'none';
  const maxVal = suit === 'spades' ? 13 : (useAceAsOne ? 13 : 14);

  while (jokerIdx < jokers.length) {
    if (currentVal <= maxVal) {
      result.push(jokers[jokerIdx]);
      currentVal++;
    } else {
      result.unshift(jokers[jokerIdx]);
      startVal--; // Update start value because we unshifted
    }
    jokerIdx++;
  }

  // Final pass: Ensure all Jokers have their assignedValue updated for stability
  let runningVal = startVal;
  return result.map(c => {
    if (c.isJoker) {
      return { ...c, assignedValue: runningVal++ };
    }
    runningVal++;
    return c;
  });
};

export const sortSameValueCombo = (cards: Card[]): Card[] => {
  const jokers = cards.filter(c => c.isJoker);
  const regulars = cards.filter(c => !c.isJoker);
  return [...regulars, ...jokers];
};

function getCoveredValues(seq: Card[]): number[] {
  const jokers = seq.filter(c => c.isJoker);
  const regulars = seq.filter(c => !c.isJoker);
  if (regulars.length === 0) return [];
  
  let useAceAsOne = false;
  const hasAce = regulars.some(c => c.rank === 'A');
  if (hasAce) {
    const suit = regulars[0].suit;
    const maxRange = suit === 'spades' ? 12 : 14;
    const valid14 = validateSequenceValues(regulars.map(c => c.value), jokers.length, maxRange);
    const valid1 = validateSequenceValues(regulars.map(c => c.rank === 'A' ? 1 : c.value), jokers.length, 13);
    if (valid1 && !valid14) useAceAsOne = true;
  }
  
  const minReg = Math.min(...regulars.map(c => (useAceAsOne && c.rank === 'A') ? 1 : c.value));
  
  const values = [];
  for (let v = minReg; v < minReg + seq.length; v++) {
    values.push(v);
  }
  return values;
}

function isValueBlocked(val: number, activeSequences: Card[][]): boolean {
  const targetVal = val === 1 ? 14 : val;
  for (const seq of activeSequences) {
    if (isSameValueCombo(seq) && seq.length >= 3) {
      const regulars = seq.filter(c => !c.isJoker);
      if (regulars.length > 0 && regulars[0].value === targetVal) {
        return true;
      }
    }
  }
  return false;
}

export const validatePlayMulti = (playedCards: Card[], activeSequences: Card[][]): { valid: boolean, sequenceIndex: number, newSequence: Card[] } => {
  if (playedCards.length === 0) return { valid: false, sequenceIndex: -1, newSequence: [] };
  
  // Start new sequence
  if (playedCards.length >= 3 && isSequence(playedCards)) {
    if (isStrictOrderedSequence(playedCards)) {
      return { valid: true, sequenceIndex: -1, newSequence: playedCards };
    }
    return { valid: true, sequenceIndex: -1, newSequence: sortSequence(playedCards) };
  }
  
  // Start new 3-of-a-kind, 4-of-a-kind, or 5-of-a-kind
  if (playedCards.length >= 3 && isSameValueCombo(playedCards)) {
    return { valid: true, sequenceIndex: -1, newSequence: sortSameValueCombo(playedCards) };
  }
  
  // Continue existing
  for (let i = 0; i < activeSequences.length; i++) {
    const combined = [...activeSequences[i], ...playedCards];
    
    // Check if extending a sequence
    if (isSequence(combined) && isSequence(activeSequences[i])) {
      if (isSequenceComplete(activeSequences[i])) {
        continue; // Cannot extend a complete sequence
      }

      const prevValues = getCoveredValues(activeSequences[i]);
      const playedRegulars = playedCards.filter(c => !c.isJoker);
      let isReplacingJoker = false;
      
      if (playedRegulars.length > 0) {
        let useAceAsOne = false;
        const hasAce = activeSequences[i].some(c => c.rank === 'A' && !c.isJoker) || playedRegulars.some(c => c.rank === 'A');
        if (hasAce) {
          const combinedRegulars = combined.filter(c => !c.isJoker);
          const suit = combinedRegulars[0].suit;
          const maxRange = suit === 'spades' ? 12 : 14;
          const combinedJokersCount = combined.filter(c => c.isJoker).length;
          const valid14 = validateSequenceValues(combinedRegulars.map(c => c.value), combinedJokersCount, maxRange);
          const valid1 = validateSequenceValues(combinedRegulars.map(c => c.rank === 'A' ? 1 : c.value), combinedJokersCount, 13);
          if (valid1 && !valid14) useAceAsOne = true;
        }

        for (const pr of playedRegulars) {
          const prVal = (useAceAsOne && pr.rank === 'A') ? 1 : pr.value;
          if (prevValues.includes(prVal)) {
            isReplacingJoker = true;
            break;
          }
        }
      }

      if (isReplacingJoker) {
        continue; // Cannot replace or shift a Joker
      }

      if (playedCards.length === 1) {
        const newValues = getCoveredValues(combined);
        const addedValues = newValues.filter(v => !prevValues.includes(v));
        
        if (addedValues.length > 0 && isValueBlocked(addedValues[0], activeSequences)) {
          // Blocked by a SameValueCombo on the table!
          continue; 
        }
      }

      return { valid: true, sequenceIndex: i, newSequence: sortSequence(combined) };
    }
    
    // Check if extending a same value combo
    if (isSameValueCombo(combined) && isSameValueCombo(activeSequences[i])) {
      // Cannot extend a dead combo
      if (activeSequences[i].some(c => c.isDead)) {
        continue;
      }
      
      // Check if this play kills the combo
      // Kills if appending exactly 1 card, which is a Joker, to a combo of >= 3 cards
      if (playedCards.length === 1 && (playedCards[0].isJoker || (playedCards[0].rank === 'A' && playedCards[0].suit === 'spades')) && activeSequences[i].length >= 3) {
        const newSequence = sortSameValueCombo(combined);
        // Mark ALL cards in the sequence as dead
        const killedSeq = newSequence.map(c => ({ ...c, isDead: true }));
        return { valid: true, sequenceIndex: i, newSequence: killedSeq };
      }

      return { valid: true, sequenceIndex: i, newSequence: sortSameValueCombo(combined) };
    }
  }
  
  return { valid: false, sequenceIndex: -1, newSequence: [] };
};

export const extractAllSequences = (hand: Card[]): { sequences: Card[][], remainingHand: Card[] } => {
  let currentHand = [...hand];
  let sequences: Card[][] = [];
  
  const findInSuit = (suitCards: Card[], availableJokers: Card[]): Card[] | null => {
    if (suitCards.length === 0) return null;
    
    for (const treatAceAsOne of [false, true]) {
      const sorted = [...suitCards].sort((a, b) => {
        const vA = (treatAceAsOne && a.rank === 'A') ? 1 : a.value;
        const vB = (treatAceAsOne && b.rank === 'A') ? 1 : b.value;
        return vA - vB;
      });

      for (let i = 0; i <= sorted.length - 3; i++) {
        const triple = [sorted[i], sorted[i+1], sorted[i+2]];
        if (isSequence(triple)) return triple;
      }

      if (availableJokers.length >= 1) {
        for (let i = 0; i <= sorted.length - 2; i++) {
          const pair = [sorted[i], sorted[i+1]];
          const combined = [...pair, availableJokers[0]];
          if (isSequence(combined)) return combined;
        }
      }

      if (availableJokers.length >= 2) {
        for (let i = 0; i < sorted.length; i++) {
          const combined = [sorted[i], availableJokers[0], availableJokers[1]];
          if (isSequence(combined)) return combined;
        }
      }
    }
    return null;
  };

  const suits: ('hearts' | 'diamonds' | 'clubs' | 'spades')[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  
  let found = true;
  while (found) {
    found = false;
    for (const suit of suits) {
      const suitCards = currentHand.filter(c => c.suit === suit && !c.isJoker);
      const currentJokers = currentHand.filter(c => c.isJoker);
      const seq = findInSuit(suitCards, currentJokers);
      if (seq) {
        sequences.push(seq);
        currentHand = currentHand.filter(c => !seq.find(s => s.id === c.id));
        found = true;
        break;
      }
    }
  }

  return { sequences, remainingHand: currentHand };
};

export const extractSameValueCombo = (hand: Card[], minCount: number): { combo: Card[], remainingHand: Card[] } => {
  let currentHand = [...hand];
  const valueCounts = new Map<number, Card[]>();
  const jokers = currentHand.filter(c => c.isJoker);
  
  for (const c of currentHand) {
    if (c.isJoker) continue;
    if (!valueCounts.has(c.value)) valueCounts.set(c.value, []);
    valueCounts.get(c.value)!.push(c);
  }

  for (const [val, cards] of valueCounts.entries()) {
    if (cards.length >= minCount) {
      const combo = cards.slice(0, minCount);
      const remainingHand = currentHand.filter(c => !combo.find(k => k.id === c.id));
      return { combo, remainingHand };
    }
  }
  
  for (const [val, cards] of valueCounts.entries()) {
    if (cards.length + jokers.length >= minCount) {
      const neededJokers = minCount - cards.length;
      const combo = [...cards, ...jokers.slice(0, neededJokers)];
      const remainingHand = currentHand.filter(c => !combo.find(k => k.id === c.id));
      return { combo, remainingHand };
    }
  }

  return { combo: [], remainingHand: hand };
};

export const calculateHandValue = (hand: Card[]): number => {
  const hasJoker = hand.some(c => c.isJoker);
  if (hasJoker) return 100;

  const sum = hand.reduce((acc, card) => acc + card.value, 0);
  return Math.min(sum, 100);
};

export const calculateWinnerBonus = (finalMeld: Card[], isAttachment?: boolean): number => {
  if (finalMeld.length === 0) return 0;
  
  if (isAttachment) {
    return -25;
  }
  
  const hasJoker = finalMeld.some(c => c.isJoker);
  const isSeq = isSequence(finalMeld);
  const isSet = isSameValueCombo(finalMeld);
  
  if (isSeq) {
    return hasJoker ? -100 : -75;
  }
  
  if (isSet) {
    return -50;
  }
  
  return 0;
};
