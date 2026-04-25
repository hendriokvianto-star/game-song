import { create } from 'zustand';
import { Card, GameState, Player, Suit } from '../logic/types';
import { Language } from '../logic/i18n';
import { createDeck, shuffle, deal } from '../logic/game-engine';
import { validatePlayMulti, extractAllSequences, extractSameValueCombo, isSequence, isSameValueCombo, calculateHandValue, calculateWinnerBonus } from '../logic/combinations';
import { AIBot } from '../logic/ai-engine';
import * as Haptics from 'expo-haptics';

interface GameStore extends GameState {
  activeSequences: Card[][];
  selectedCardIds: string[];
  lastPlayInfo: { playerName: string; message: string } | null;
  playHistory: { id: string; message: string; timestamp: number }[];
  consecutivePasses: number;
  cardsDealt: number;
  currentHint: { message: string, cardIds: string[] } | null;
  currentTheme: 'classic' | 'luxury' | 'ocean' | 'midnight';
  sfxTrigger: { type: 'draw' | 'play' | 'win' | 'mati' | 'deal', timestamp: number } | null;
  language: Language;
  tutorialStep: number | null;

  // Actions
  initializeGame: () => void;
  executeOpeningPhase: () => void;
  toggleCardSelection: (cardId: string) => void;
  playSelectedCards: () => boolean;
  playDraggedCard: (cardId: string) => void;
  passTurn: () => void;
  executeAITurn: () => void;
  restartGame: () => void;
  nextRound: () => void;
  reorderHand: (fromIndex: number, toIndex: number) => void;
  runDealAnimation: (shuffledDeck: Card[]) => void;
  eliminateCurrentPlayer: () => void;
  clearCeremony: () => void;
  provideHint: () => void;
  clearHint: () => void;
  setTheme: (theme: 'classic' | 'luxury' | 'ocean' | 'midnight') => void;
  triggerSFX: (type: 'draw' | 'play' | 'win' | 'mati' | 'deal') => void;
  setLanguage: (lang: Language) => void;
  startTutorial: () => void;
  nextTutorialStep: () => void;
  closeTutorial: () => void;
}

const getNextActivePlayer = (currentIndex: number, direction: number, players: Player[]): number => {
  const total = players.length;
  let next = (currentIndex + direction + total) % total;
  let attempts = 0;
  while (players[next].finishedOrder !== undefined && attempts < total) {
    next = (next + direction + total) % total;
    attempts++;
  }
  return next;
};

const countActivePlayers = (players: Player[]): number => {
  return players.filter(p => p.finishedOrder === undefined).length;
};

const determineNextTurn = (state: GameState, newPlayers: Player[], newStatus: GameState['status']): { nextPlayerIndex: number, newAllPlayersOpened: boolean } => {
  let nextPlayerIndex = newStatus === 'finished'
      ? state.currentPlayerIndex
      : getNextActivePlayer(state.currentPlayerIndex, state.direction, newPlayers);
  
  let newAllPlayersOpened = state.allPlayersOpened || false;

  if (newStatus !== 'finished' && !newAllPlayersOpened) {
    const activePlayers = newPlayers.filter(p => p.finishedOrder === undefined);
    if (activePlayers.length > 0 && activePlayers.every(p => p.hasOpened)) {
      newAllPlayersOpened = true;
      let minVal = Infinity;
      let startingPlayerId = '';
      for (const p of activePlayers) {
        if (p.openingValue !== undefined && p.openingValue < minVal) {
          minVal = p.openingValue;
          startingPlayerId = p.id;
        }
      }
      if (startingPlayerId) {
        nextPlayerIndex = newPlayers.findIndex(p => p.id === startingPlayerId);
      }
    }
  }
  
  return { nextPlayerIndex, newAllPlayersOpened };
};

export const useGameStore = create<GameStore>((set, get) => ({
  deck: [],
  discardPile: [],
  players: [],
  currentPlayerIndex: 0,
  direction: 1,
  status: 'idle',
  winnerId: undefined,
  finishCount: 0,
  activeSequences: [],
  selectedCardIds: [],
  lastPlayInfo: null,
  playHistory: [],
  consecutivePasses: 0,
  cardsDealt: 0,
  currentHint: null,
  currentTheme: 'classic',
  sfxTrigger: null,
  language: 'id',
  tutorialStep: null,

  allPlayersOpened: false,
  currentRound: 1,
  lastFinishingMeld: [],
  matchWinnerId: undefined,

  initializeGame: () => {
    const rawDeck = createDeck();
    const shuffled = shuffle(rawDeck);

    const players: Player[] = [
      { id: 'p1', name: 'You', hand: [], isAI: false, totalScore: 0 },
      { id: 'p2', name: 'Bot 1', hand: [], isAI: true, totalScore: 0, difficulty: 'easy' },
      { id: 'p3', name: 'Bot 2', hand: [], isAI: true, totalScore: 0, difficulty: 'normal' },
      { id: 'p4', name: 'Bot 3', hand: [], isAI: true, totalScore: 0, difficulty: 'expert' },
      { id: 'p5', name: 'Bot 4', hand: [], isAI: true, totalScore: 0, difficulty: 'expert' },
    ];

    set({
      deck: shuffled,
      discardPile: [],
      players,
      currentPlayerIndex: 0,
      direction: 1,
      status: 'dealing' as GameState['status'],
      winnerId: undefined,
      finishCount: 0,
      activeSequences: [],
      selectedCardIds: [],
      lastPlayInfo: null,
      playHistory: [],
      consecutivePasses: 0,
      cardsDealt: 0,
      allPlayersOpened: false,
      currentRound: 1,
      lastFinishingMeld: [],
      matchWinnerId: undefined,
      ceremonyWinnerId: undefined,
      currentHint: null,
    });
    console.log("[Game] Initialized - Version 1.1 - Resetting all states");

    setTimeout(() => {
      get().runDealAnimation(shuffled);
    }, 500);
  },

  runDealAnimation: (shuffledDeck: Card[]) => {
    let currentDealIndex = 0;
    const totalToDeal = 5 * 20; // 5 players, 20 cards each
    const deckCopy = [...shuffledDeck];

    const dealNextCard = () => {
      const state = get();
      if (state.status !== 'dealing') return;

      const playerIndex = currentDealIndex % 5;
      const nextCard = deckCopy.pop();

      if (!nextCard) return;

      const newPlayers = [...state.players];
      newPlayers[playerIndex] = {
        ...newPlayers[playerIndex],
        hand: [...newPlayers[playerIndex].hand, nextCard],
      };

      set({
        deck: deckCopy,
        players: newPlayers,
        cardsDealt: currentDealIndex + 1,
      });

      if (currentDealIndex % 10 === 0) {
        get().triggerSFX('deal');
      }

      currentDealIndex++;

      // Trigger light haptic for the human player's card
      if (playerIndex === 0 && currentDealIndex % 5 === 1) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      if (currentDealIndex < totalToDeal) {
        setTimeout(dealNextCard, 140); // 140ms per card = 14 seconds total
      } else {
        // Sort human player's hand for convenience
        const finalPlayers = [...newPlayers];
        const humanIdx = finalPlayers.findIndex(p => !p.isAI);
        if (humanIdx !== -1) {
          finalPlayers[humanIdx].hand.sort((a, b) => {
            if (a.suit !== b.suit) return a.suit.localeCompare(b.suit);
            return a.value - b.value;
          });
        }
        
        set({ players: finalPlayers, status: 'opening' });
        
        setTimeout(() => {
          get().executeOpeningPhase();
        }, 1200);
      }
    };

    dealNextCard();
  },

  executeOpeningPhase: () => {
    const state = get();
    if (state.status !== 'opening') return;

    let newActiveSequences = [...state.activeSequences];
    let newPlayers = [...state.players];
    let newFinishCount = state.finishCount;

    // 1. Process combinations (Sequences and 5-of-a-kind)
    for (let i = 0; i < newPlayers.length; i++) {
      const player = newPlayers[i];
      const { sequences } = extractAllSequences(player.hand);
      
      let hasValidOpening = sequences.length > 0;

      if (!hasValidOpening) {
        // If no sequences, check for 5-of-a-kind
        const { combo } = extractSameValueCombo(player.hand, 5);
        if (combo.length >= 5) {
          hasValidOpening = true;
        }
      }

      if (!hasValidOpening) {
        // Mark for instant game over due to deadlock in opening
        (newPlayers[i] as any).deadlockedInOpening = true;
      }
      // If hasValidOpening is true, they keep their cards in hand.
    }

    // 2. Handle Instant Game Overs (assigning them the worst ranks)
    const losers = newPlayers.filter(p => (p as any).instantGameOver);
    let currentBadRank = newPlayers.length; // 5 if 5 players

    // Give worst ranks to all instant losers
    for (let i = 0; i < newPlayers.length; i++) {
      if ((newPlayers[i] as any).deadlockedInOpening) {
        newPlayers[i].finishedOrder = currentBadRank;
        currentBadRank--;
        newFinishCount++;
      }
    }

    // 3. Determine if game ended immediately
    let newStatus = 'playing';
    let newWinnerId = state.winnerId;
    let finalWinnerIdForMatch = undefined;
    
    const survivingPlayers = newPlayers.filter(p => p.finishedOrder === undefined);
    if (survivingPlayers.length <= 1) {
      if (survivingPlayers.length === 1) {
        newFinishCount++;
        const survivorIdx = newPlayers.findIndex(p => p.id === survivingPlayers[0].id);
        newPlayers[survivorIdx].finishedOrder = newFinishCount; // They get 1st place
        newWinnerId = survivingPlayers[0].id;
        set({ ceremonyWinnerId: newWinnerId });
        get().triggerSFX('win');
      }
      newStatus = 'finished';

      // Calculate Scores
      newPlayers.forEach((p, idx) => {
        let roundScore = 0;
        if (p.id === newWinnerId) {
          roundScore = -50; // Standard win bonus for opening phase win
        } else if ((p as any).deadlockedInOpening) {
          roundScore = 100; // Deadlock in opening penalty
        } else {
          roundScore = calculateHandValue(p.hand, !!newWinnerId);
        }
        
        const newTotalScore = p.totalScore + roundScore;
        newPlayers[idx] = { 
          ...newPlayers[idx], 
          pointsGainedThisRound: roundScore, 
          totalScore: newTotalScore 
        };

        if (newTotalScore >= 500) {
          const sortedByTotal = [...newPlayers].sort((a, b) => a.totalScore - b.totalScore);
          finalWinnerIdForMatch = sortedByTotal[0].id;
        }
      });
    }

    const { nextPlayerIndex, newAllPlayersOpened } = determineNextTurn(state, newPlayers, newStatus as GameState['status']);

    set({
      players: newPlayers,
      activeSequences: newActiveSequences,
      status: newStatus as any,
      finishCount: newFinishCount,
      winnerId: newWinnerId,
      matchWinnerId: finalWinnerIdForMatch,
      currentPlayerIndex: nextPlayerIndex,
      allPlayersOpened: newAllPlayersOpened,
    });
  },

  toggleCardSelection: (cardId: string) => {
    set((state) => {
      const isSelected = state.selectedCardIds.includes(cardId);
      if (isSelected) {
        return { selectedCardIds: state.selectedCardIds.filter(id => id !== cardId) };
      } else {
        if (state.selectedCardIds.length >= 5) {
          // Limit to 5 cards max. Replace the last selected card.
          return { selectedCardIds: [...state.selectedCardIds.slice(0, 4), cardId] };
        }
        return { selectedCardIds: [...state.selectedCardIds, cardId] };
      }
    });
  },

  playSelectedCards: (): boolean => {
    const state = get();
    if (state.status !== 'playing' || state.players[state.currentPlayerIndex].isAI) return false;

    const currentPlayer = state.players[state.currentPlayerIndex];
    // Preserve the exact order in which cards were selected!
    const selectedCards = state.selectedCardIds
      .map(id => currentPlayer.hand.find(c => c.id === id))
      .filter((c): c is Card => c !== undefined);

    if (selectedCards.length === 0) return false;

    const { valid, sequenceIndex, newSequence } = validatePlayMulti(selectedCards, state.activeSequences);
    if (!valid) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      alert("Invalid play! Must start a new sequence of 3+ cards, or extend an existing sequence on the table.");
      return false;
    }

    // Check hasOpened and opening rules
    if (!currentPlayer.hasOpened) {
      if (sequenceIndex !== -1) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        alert("Anda harus meletakkan seri atau 5-Kembar terlebih dahulu sebelum bisa menempel kartu!");
        return false;
      }
      
      // Opening a new meld
      const isSet = isSameValueCombo(selectedCards);
      const isSeq = isSequence(selectedCards);
      
      if (isSet && !isSeq && selectedCards.length < 5) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        alert("Untuk pembukaan pertama, angka kembar (set) harus berjumlah minimal 5 kartu!");
        return false;
      }
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const newHand = currentPlayer.hand.filter(c => !state.selectedCardIds.includes(c.id));
    const newPlayers = [...state.players];
    newPlayers[state.currentPlayerIndex] = { ...currentPlayer, hand: newHand };

    let updatedSequences = [...state.activeSequences];
    if (sequenceIndex === -1) {
      updatedSequences.push(newSequence);
      newPlayers[state.currentPlayerIndex].hasOpened = true;
      newPlayers[state.currentPlayerIndex].openingValue = newSequence[0].value;
    } else {
      updatedSequences[sequenceIndex] = newSequence;
    }

    let newFinishCount = state.finishCount;
    let newWinnerId = state.winnerId;
    let newStatus: GameState['status'] = state.status;

    // Check if player finished
    if (newHand.length === 0) {
      newFinishCount++;
      newPlayers[state.currentPlayerIndex] = {
        ...newPlayers[state.currentPlayerIndex],
        finishedOrder: newFinishCount,
      };
      if (!newWinnerId) {
        newWinnerId = currentPlayer.id;
        set({ ceremonyWinnerId: currentPlayer.id });
        get().triggerSFX('win');
      }

      // Capture the finishing meld
      const lastFinishingMeld = selectedCards;

      // Game over immediately!
      newStatus = 'finished';

      // Assign remaining ranks based on fewest cards left
      const remainingPlayers = newPlayers
        .filter(p => p.finishedOrder === undefined)
        .sort((a, b) => a.hand.length - b.hand.length);
      
      remainingPlayers.forEach(p => {
        newFinishCount++;
        const idx = newPlayers.findIndex(x => x.id === p.id);
        newPlayers[idx] = { ...p, finishedOrder: newFinishCount };
      });

      // Calculate Scores
      const winnerBonus = calculateWinnerBonus(lastFinishingMeld, sequenceIndex !== -1);
      let finalWinnerIdForMatch = undefined;

      newPlayers.forEach((p, idx) => {
        let roundScore = 0;
        if (p.id === newWinnerId) {
          roundScore = winnerBonus;
        } else {
          roundScore = calculateHandValue(p.hand, true);
        }
        
        const newTotalScore = p.totalScore + roundScore;
        newPlayers[idx] = { 
          ...p, 
          pointsGainedThisRound: roundScore, 
          totalScore: newTotalScore 
        };

        if (newTotalScore >= 500) {
          // Match is over! Find the one with lowest total score
          const sortedByTotal = [...newPlayers].sort((a, b) => a.totalScore - b.totalScore);
          finalWinnerIdForMatch = sortedByTotal[0].id;
        }
      });

      set({
        lastFinishingMeld,
        matchWinnerId: finalWinnerIdForMatch,
      });
    }

    const { nextPlayerIndex, newAllPlayersOpened } = determineNextTurn(state, newPlayers, newStatus);

      const formatSuit = (s: string) => s === 'none' ? '' : s;
      const cardNames = selectedCards.map(c => c.isJoker ? 'Joker' : `${c.rank} ${formatSuit(c.suit)}`).join(', ');
      const actionMessage = sequenceIndex === -1 ? `membuka seri baru dengan ${cardNames}` : `menempelkan ${cardNames} di Seq ${sequenceIndex + 1}`;

      set({
        players: newPlayers,
        activeSequences: updatedSequences,
        selectedCardIds: [],
        currentPlayerIndex: nextPlayerIndex,
        finishCount: newFinishCount,
        winnerId: newWinnerId,
        status: newStatus,
        lastPlayInfo: { playerName: currentPlayer.name, message: `${currentPlayer.name} ${actionMessage}` },
        playHistory: [{ id: Math.random().toString(36).substr(2, 9), message: `${currentPlayer.name} ${actionMessage}`, timestamp: Date.now() }, ...state.playHistory],
        consecutivePasses: 0,
        allPlayersOpened: newAllPlayersOpened,
      });
      get().triggerSFX('play');
    return true;
  },

  playDraggedCard: (cardId: string) => {
    const state = get();
    if (state.status !== 'playing' || state.players[state.currentPlayerIndex].isAI) return;

    const wasSelected = state.selectedCardIds.includes(cardId);
    const originalSelection = [...state.selectedCardIds];

    if (!wasSelected) {
      set({ selectedCardIds: [cardId] });
    }

    const success = get().playSelectedCards();

    if (!success && !wasSelected) {
      set({ selectedCardIds: originalSelection });
    }
  },

  passTurn: () => {
    const state = get();
    if (state.status !== 'playing' || state.players[state.currentPlayerIndex].isAI) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    // Instead of ending the game immediately, eliminate the player (mati) and let bots finish the match
    get().eliminateCurrentPlayer();
  },

  eliminateCurrentPlayer: () => {
    const state = get();
    if (state.status !== 'playing') return;

    const newPlayers = [...state.players];
    const pIdx = state.currentPlayerIndex;
    const currentPlayer = newPlayers[pIdx];

    const remainingCount = newPlayers.filter(p => p.finishedOrder === undefined).length;
    // We just set finishedOrder so their turn is skipped, but we DO NOT empty their hand
    // so they can still see what cards they were stuck with
    newPlayers[pIdx] = { ...currentPlayer, finishedOrder: remainingCount };
    
    let newFinishCount = state.finishCount;
    let newStatus: GameState['status'] = state.status;
    let newWinnerId = state.winnerId;

    get().triggerSFX('mati');

    if (countActivePlayers(newPlayers) === 0) {
      newStatus = 'finished';

      // If everyone deadlocked and no one actually finished the game, 
      // then there is NO winner and NO winner bonus.
      if (!state.winnerId) {
        newWinnerId = undefined;
      }

      // Calculate Scores for the round
      const lastFinishingMeld = state.lastFinishingMeld; 
      // If we have a real winnerId (from someone finishing), use the bonus.
      // Otherwise (total deadlock), winnerBonus is 0.
      const winnerBonus = newWinnerId ? calculateWinnerBonus(lastFinishingMeld || [], false) : 0; 
      
      let finalWinnerIdForMatch = undefined;
      newPlayers.forEach((p, idx) => {
        let roundScore = 0;
        if (newWinnerId && p.id === newWinnerId) {
          roundScore = winnerBonus;
        } else if ((p as any).deadlockedInOpening) {
          roundScore = 100;
        } else {
          roundScore = calculateHandValue(p.hand, !!newWinnerId);
        }
        
        const newTotalScore = p.totalScore + roundScore;
        newPlayers[idx] = { 
          ...newPlayers[idx], 
          pointsGainedThisRound: roundScore, 
          totalScore: newTotalScore 
        };

        if (newTotalScore >= 500) {
          const sortedByTotal = [...newPlayers].sort((a, b) => a.totalScore - b.totalScore);
          finalWinnerIdForMatch = sortedByTotal[0].id;
        }
      });
      
      set({ matchWinnerId: finalWinnerIdForMatch });
    }

    const { nextPlayerIndex, newAllPlayersOpened } = determineNextTurn(state, newPlayers, newStatus);

    set({
      players: newPlayers,
      currentPlayerIndex: nextPlayerIndex,
      status: newStatus,
      winnerId: newWinnerId,
      lastPlayInfo: { playerName: currentPlayer.name, message: `${currentPlayer.name} tereliminasi karena tidak bisa jalan!` },
      playHistory: [{ id: Math.random().toString(36).substr(2, 9), message: `${currentPlayer.name} tereliminasi karena tidak bisa jalan!`, timestamp: Date.now() }, ...state.playHistory],
      selectedCardIds: [],
      allPlayersOpened: newAllPlayersOpened,
    });
  },

  executeAITurn: () => {
    const state = get();
    if (state.status !== 'playing') return;
    
    const currentPlayer = state.players[state.currentPlayerIndex];
    if (!currentPlayer || !currentPlayer.isAI) return;

    const { cardsToPlay, sequenceIndex } = AIBot.getBestPlayMulti(currentPlayer.hand, state.activeSequences, !!currentPlayer.hasOpened, currentPlayer.difficulty || 'normal');

    if (cardsToPlay.length > 0) {
      const { newSequence } = validatePlayMulti(cardsToPlay, state.activeSequences);
      const playedIds = cardsToPlay.map(c => c.id);
      const newHand = currentPlayer.hand.filter(c => !playedIds.includes(c.id));
      const newPlayers = [...state.players];
      newPlayers[state.currentPlayerIndex] = { ...currentPlayer, hand: newHand };

      let updatedSequences = [...state.activeSequences];
      if (sequenceIndex === -1) {
        updatedSequences.push(newSequence);
        newPlayers[state.currentPlayerIndex].hasOpened = true;
        newPlayers[state.currentPlayerIndex].openingValue = newSequence[0].value;
      } else {
        updatedSequences[sequenceIndex] = newSequence;
      }

      let newFinishCount = state.finishCount;
      let newWinnerId = state.winnerId;
      let newStatus: GameState['status'] = state.status;

      // Check if AI finished
      if (newHand.length === 0) {
        newFinishCount++;
        newPlayers[state.currentPlayerIndex] = {
          ...newPlayers[state.currentPlayerIndex],
          finishedOrder: newFinishCount,
        };
        if (!newWinnerId) {
          newWinnerId = currentPlayer.id;
          set({ ceremonyWinnerId: currentPlayer.id });
          get().triggerSFX('win');
        }

        // Capture finishing meld
        const lastFinishingMeld = cardsToPlay;

        // Game over immediately!
        newStatus = 'finished';

        // Assign remaining ranks based on fewest cards left
        const remainingPlayers = newPlayers
          .filter(p => p.finishedOrder === undefined)
          .sort((a, b) => a.hand.length - b.hand.length);
        
        remainingPlayers.forEach(p => {
          newFinishCount++;
          const idx = newPlayers.findIndex(x => x.id === p.id);
          newPlayers[idx] = { ...p, finishedOrder: newFinishCount };
        });

        // Calculate Scores
        const winnerBonus = calculateWinnerBonus(lastFinishingMeld, sequenceIndex !== -1);
        let finalWinnerIdForMatch = undefined;

        newPlayers.forEach((p, idx) => {
          let roundScore = 0;
          if (p.id === newWinnerId) {
            roundScore = winnerBonus;
          } else {
            roundScore = calculateHandValue(p.hand);
          }
          
          const newTotalScore = p.totalScore + roundScore;
          newPlayers[idx] = { 
            ...p, 
            pointsGainedThisRound: roundScore, 
            totalScore: newTotalScore 
          };

          if (newTotalScore >= 500) {
            const sortedByTotal = [...newPlayers].sort((a, b) => a.totalScore - b.totalScore);
            finalWinnerIdForMatch = sortedByTotal[0].id;
          }
        });

        set({
          lastFinishingMeld,
          matchWinnerId: finalWinnerIdForMatch,
        });
      }

      const { nextPlayerIndex, newAllPlayersOpened } = determineNextTurn(state, newPlayers, newStatus);

      const formatSuit = (s: string) => s === 'none' ? '' : s;
      const cardNames = cardsToPlay.map(c => c.isJoker ? 'Joker' : `${c.rank} ${formatSuit(c.suit)}`).join(', ');
      const actionMessage = sequenceIndex === -1 ? `membuka seri baru dengan ${cardNames}` : `menempelkan ${cardNames} di Seq ${sequenceIndex + 1}`;

      set({
        players: newPlayers,
        activeSequences: updatedSequences,
        currentPlayerIndex: nextPlayerIndex,
        finishCount: newFinishCount,
        winnerId: newWinnerId,
        status: newStatus as any,
        lastPlayInfo: { playerName: currentPlayer.name, message: `${currentPlayer.name} ${actionMessage}` },
        playHistory: [{ id: Math.random().toString(36).substr(2, 9), message: `${currentPlayer.name} ${actionMessage}`, timestamp: Date.now() }, ...state.playHistory],
        consecutivePasses: 0,
        allPlayersOpened: newAllPlayersOpened,
      });
      get().triggerSFX('play');
    } else {
      // AI has no valid moves, it is automatically eliminated!
      get().eliminateCurrentPlayer();
    }
  },

  restartGame: () => {
    get().initializeGame();
  },

  nextRound: () => {
    const state = get();
    const rawDeck = createDeck();
    const shuffled = shuffle(rawDeck);

    // Reset players for new round but keep totalScore
    const newPlayers = state.players.map(p => ({
      ...p,
      hand: [],
      finishedOrder: undefined,
      hasOpened: false,
      openingValue: undefined,
      pointsGainedThisRound: undefined,
      deadlockedInOpening: false,
    }));

    set({
      deck: shuffled,
      discardPile: [],
      players: newPlayers,
      currentPlayerIndex: 0,
      direction: 1,
      status: 'dealing' as GameState['status'],
      winnerId: undefined,
      finishCount: 0,
      activeSequences: [],
      selectedCardIds: [],
      lastPlayInfo: null,
      playHistory: [],
      consecutivePasses: 0,
      cardsDealt: 0,
      allPlayersOpened: false,
      currentRound: state.currentRound + 1,
      lastFinishingMeld: [],
      matchWinnerId: undefined,
    });

    setTimeout(() => {
      get().runDealAnimation(shuffled);
    }, 500);
  },

  reorderHand: (fromIndex: number, toIndex: number) => {
    const state = get();
    const humanIdx = state.players.findIndex(p => !p.isAI);
    if (humanIdx === -1) return;

    const humanPlayer = state.players[humanIdx];
    const newHand = [...humanPlayer.hand];
    const [card] = newHand.splice(fromIndex, 1);
    newHand.splice(toIndex, 0, card);

    const newPlayers = [...state.players];
    newPlayers[humanIdx] = { ...humanPlayer, hand: newHand };
    set({ players: newPlayers });
  },

  clearCeremony: () => {
    set({ ceremonyWinnerId: undefined });
  },

  provideHint: () => {
    const state = get();
    const currentPlayer = state.players[state.currentPlayerIndex];
    if (currentPlayer.isAI || state.status !== 'playing') return;

    const { cardsToPlay, sequenceIndex } = AIBot.getBestPlayMulti(currentPlayer.hand, state.activeSequences, !!currentPlayer.hasOpened, 'expert');
    
    if (cardsToPlay.length > 0) {
      let msg = "";
      if (sequenceIndex === -1) {
        msg = "💡 Kamu bisa membuka kombinasi baru!";
      } else {
        msg = `💡 Kamu bisa menempelkan kartu di Seq ${sequenceIndex + 1}!`;
      }
      set({ currentHint: { message: msg, cardIds: cardsToPlay.map(c => c.id) } });
    } else {
      set({ currentHint: { message: "❌ Kamu sedang Deadlock. Kartu di tangan tidak bisa jalan.", cardIds: [] } });
    }
  },

  clearHint: () => {
    set({ currentHint: null });
  },

  setTheme: (theme) => {
    set({ currentTheme: theme });
  },

  triggerSFX: (type) => {
    set({ sfxTrigger: { type, timestamp: Date.now() } });
  },

  setLanguage: (lang) => {
    set({ language: lang });
  },

  startTutorial: () => {
    set({ tutorialStep: 0 });
  },

  nextTutorialStep: () => {
    set((state) => ({ 
      tutorialStep: state.tutorialStep !== null ? state.tutorialStep + 1 : null 
    }));
  },

  closeTutorial: () => {
    set({ tutorialStep: null });
  },
}));
