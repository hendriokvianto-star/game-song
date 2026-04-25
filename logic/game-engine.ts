import { Card, Suit, Rank } from './types';

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export const createDeck = (): Card[] => {
  const deck: Card[] = [];
  let idCounter = 0;
  
  // Create 2 standard decks
  for (let deckNum = 0; deckNum < 2; deckNum++) {
    for (const suit of SUITS) {
      if (suit === 'none') continue; // Skip none for regular cards
      for (let i = 0; i < RANKS.length; i++) {
        if (RANKS[i] === 'Joker') continue;
        
        const isAceOfSpades = suit === 'spades' && RANKS[i] === 'A';
        
        deck.push({
          id: `card-${idCounter++}`,
          suit,
          rank: RANKS[i],
          value: isAceOfSpades ? 15 : i + 2, // Ace of Spades gets value 15 (Joker)
          isJoker: isAceOfSpades,
        });
      }
    }
  }
  
  // Add 4 Jokers (Joker is the highest value card)
  for (let i = 0; i < 4; i++) {
    deck.push({
      id: `card-joker-${idCounter++}`,
      suit: 'none',
      rank: 'Joker',
      value: 15, // Joker beats Ace
      isJoker: true,
    });
  }
  
  return deck;
};

export const shuffle = (deck: Card[]): Card[] => {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
};

export const deal = (deck: Card[], numPlayers: number, cardsPerPlayer: number) => {
  const hands: Card[][] = Array.from({ length: numPlayers }, () => []);
  const remainingDeck = [...deck];

  for (let i = 0; i < cardsPerPlayer; i++) {
    for (let p = 0; p < numPlayers; p++) {
      if (remainingDeck.length > 0) {
        hands[p].push(remainingDeck.pop()!);
      }
    }
  }

  return { hands, remainingDeck };
};
