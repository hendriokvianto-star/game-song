import { Card } from './types';
import { validatePlayMulti, extractAllSequences, extractSameValueCombo } from './combinations';

export class AIBot {
  static getBestPlayMulti(hand: Card[], activeSequences: Card[][], hasOpened: boolean = false, difficulty: 'easy' | 'normal' | 'expert' = 'normal'): { cardsToPlay: Card[], sequenceIndex: number } {
    if (hand.length === 0) return { cardsToPlay: [], sequenceIndex: -1 };

    // Easy AI: 40% chance to just pass even if they have moves
    if (difficulty === 'easy' && Math.random() < 0.4) {
      return { cardsToPlay: [], sequenceIndex: -1 };
    }

    // 1. If not opened, AI MUST try to open (cannot add to sequences).
    if (!hasOpened) {
      const { sequences } = extractAllSequences(hand);
      if (sequences.length > 0) {
        // Expert: If multiple sequences, pick the one with highest values to minimize risk
        if (difficulty === 'expert' && sequences.length > 1) {
          sequences.sort((a, b) => b.reduce((sum, c) => sum + c.value, 0) - a.reduce((sum, c) => sum + c.value, 0));
        }
        return { cardsToPlay: sequences[0], sequenceIndex: -1 };
      }
      
      // If no sequence, can use 5-of-a-kind as alternative
      const { combo } = extractSameValueCombo(hand, 5);
      if (combo.length >= 5) {
        return { cardsToPlay: combo, sequenceIndex: -1 };
      }

      // If cannot open, must pass
      return { cardsToPlay: [], sequenceIndex: -1 };
    }

    // 2. If opened, AI CANNOT open again. It can ONLY try to add to existing sequences (1 or 2 cards).
    if (activeSequences.length > 0) {
      let validPlays: { cardsToPlay: Card[], sequenceIndex: number, totalValue: number }[] = [];

      // Try 1 card
      for (let i = 0; i < hand.length; i++) {
        const play = [hand[i]];
        const result = validatePlayMulti(play, activeSequences);
        if (result.valid) {
          if (difficulty !== 'expert') return { cardsToPlay: play, sequenceIndex: result.sequenceIndex };
          validPlays.push({ cardsToPlay: play, sequenceIndex: result.sequenceIndex, totalValue: hand[i].value });
        }
      }
      
      // Try 2 cards
      for (let i = 0; i < hand.length; i++) {
        for (let j = i + 1; j < hand.length; j++) {
          const play = [hand[i], hand[j]];
          const result = validatePlayMulti(play, activeSequences);
          if (result.valid) {
            if (difficulty !== 'expert') return { cardsToPlay: play, sequenceIndex: result.sequenceIndex };
            validPlays.push({ cardsToPlay: play, sequenceIndex: result.sequenceIndex, totalValue: hand[i].value + hand[j].value });
          }
        }
      }

      if (difficulty === 'expert' && validPlays.length > 0) {
        // Priority: 1. Plays that finish the hand. 2. Plays with highest value.
        const finisher = validPlays.find(p => p.cardsToPlay.length === hand.length);
        if (finisher) return finisher;

        validPlays.sort((a, b) => b.totalValue - a.totalValue);
        return validPlays[0];
      }
    }
    
    // 3. If opened but cannot add, AI can try to form a NEW sequence or NEW 3/4/5 of a kind.
    const { sequences } = extractAllSequences(hand);
    if (sequences.length > 0) {
      if (difficulty === 'expert' && sequences.length > 1) {
        sequences.sort((a, b) => b.reduce((sum, c) => sum + c.value, 0) - a.reduce((sum, c) => sum + c.value, 0));
      }
      return { cardsToPlay: sequences[0], sequenceIndex: -1 };
    }

    const { combo } = extractSameValueCombo(hand, 3);
    if (combo.length >= 3) {
      return { cardsToPlay: combo, sequenceIndex: -1 };
    }
    
    return { cardsToPlay: [], sequenceIndex: -1 };
  }
}
