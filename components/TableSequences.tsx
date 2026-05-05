import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import Animated, { ZoomIn, LinearTransition, useAnimatedStyle, withSpring, FlipInYRight } from 'react-native-reanimated';
import { useGameStore } from '../store/gameStore';
import { translations } from '../logic/i18n';
import { styles } from '../app/styles';
import { CardComponent } from './Card';
import { getSequenceHints } from '../logic/hints';
import { isSequenceComplete } from '../logic/combinations';
import { useShallow } from 'zustand/react/shallow';

const SPRING_LAYOUT = LinearTransition.springify();

const AnimatedSequenceCard = React.memo(
  ({ card, index, isExpanded, isClosed }: { card: any, index: number, isExpanded: boolean, isClosed?: boolean }) => {
    const animatedStyle = useAnimatedStyle(() => {
      const margin = index > 0 ? (isExpanded ? 8 : -20) : 0;
      return {
        marginLeft: withSpring(margin, { damping: 14, stiffness: 150 })
      };
    }, [isExpanded, index]);

    const enteringAnim = React.useMemo(() => ZoomIn.delay(index * 50).duration(400).springify(), [index]);

    return (
      <Animated.View 
        style={animatedStyle} 
        entering={enteringAnim}
        layout={SPRING_LAYOUT}
      >
        <CardComponent card={card} isFaceUp={!isClosed} compact />
      </Animated.View>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.card.id === nextProps.card.id &&
      prevProps.index === nextProps.index &&
      prevProps.isExpanded === nextProps.isExpanded &&
      prevProps.isClosed === nextProps.isClosed
    );
  }
);

// Reveal card with flip animation when transitioning from closed to open
const RevealSequenceCard = React.memo(
  ({ card, index, isExpanded }: { card: any, index: number, isExpanded: boolean }) => {
    const animatedStyle = useAnimatedStyle(() => {
      const margin = index > 0 ? (isExpanded ? 8 : -20) : 0;
      return {
        marginLeft: withSpring(margin, { damping: 14, stiffness: 150 })
      };
    }, [isExpanded, index]);

    const flipAnim = React.useMemo(() => FlipInYRight.delay(index * 100).duration(600), [index]);

    return (
      <Animated.View 
        style={animatedStyle} 
        entering={flipAnim}
        layout={SPRING_LAYOUT}
      >
        <CardComponent card={card} isFaceUp={true} compact />
      </Animated.View>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.card.id === nextProps.card.id &&
      prevProps.index === nextProps.index &&
      prevProps.isExpanded === nextProps.isExpanded
    );
  }
);

export function TableSequences() {
  const { activeSequences, language, selectedCardIds, playSelectedCards, allPlayersOpened } = useGameStore(useShallow(state => ({
    activeSequences: state.activeSequences,
    language: state.language,
    selectedCardIds: state.selectedCardIds,
    playSelectedCards: state.playSelectedCards,
    allPlayersOpened: state.allPlayersOpened,
  })));
  
  const t = translations[language];
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  // Track reveal state: cards stay face-down until allPlayersOpened,
  // then after a short delay, flip face-up simultaneously
  const [revealed, setRevealed] = useState(!!allPlayersOpened);
  const [isRevealing, setIsRevealing] = useState(false);
  const prevAllOpened = useRef(!!allPlayersOpened);

  useEffect(() => {
    if (allPlayersOpened && !prevAllOpened.current) {
      // Transition: all players just finished opening → trigger reveal
      setIsRevealing(true);
      const timer = setTimeout(() => {
        setRevealed(true);
        setIsRevealing(false);
      }, 1200);
      prevAllOpened.current = true;
      return () => clearTimeout(timer);
    }
    if (allPlayersOpened) {
      prevAllOpened.current = true;
      setRevealed(true);
    }
  }, [allPlayersOpened]);

  // Sequences shown face-down until revealed
  const showClosed = !revealed && !allPlayersOpened;

  const onSequencePress = (idx: number) => {
    if (selectedCardIds.length > 0) {
      playSelectedCards(idx);
    } else {
      setExpandedIdx(prev => (prev === idx ? null : idx));
    }
  };

  useEffect(() => {
    if (expandedIdx !== null) {
      const timer = setTimeout(() => {
        setExpandedIdx(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [expandedIdx]);

  return (
    <ScrollView style={styles.tableContainer} horizontal={false} contentContainerStyle={{ flexGrow: 1 }}>
      {activeSequences.length > 0 ? (
        <View style={styles.sequencesWrapContainer}>
        {activeSequences.map((seq, sIdx) => {
          const isExpanded = expandedIdx === sIdx;
          const hints = isExpanded && revealed ? getSequenceHints(seq) : null;

          return (
            <Pressable key={sIdx} onPress={() => onSequencePress(sIdx)}>
              <View style={[
                styles.sequenceRow, 
                isExpanded && styles.sequenceRowExpanded,
                selectedCardIds.length > 0 && styles.sequenceRowTargetable
              ]}>
                <View style={styles.sequenceBadge}>
                  <Text style={styles.sequenceBadgeText}>Seq {sIdx + 1}</Text>
                  {selectedCardIds.length > 0 && (
                    <Text style={{ fontSize: 7, color: '#3498db', fontWeight: 'bold', marginTop: 2 }}>{t.tapToAttach}</Text>
                  )}
                  {seq.some(c => c.isDead) && (
                    <View style={styles.deadLabel}>
                      <Text style={styles.deadLabelText}>{t.mati}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.sequenceCards}>
                  {isSequenceComplete(seq) && !isExpanded ? (
                    <View style={styles.deckCenterWrapper}>
                      <View style={[styles.deckBase2, { position: 'absolute' }]}>
                        <CardComponent card={seq[0]} isFaceUp={false} compact />
                      </View>
                      <View style={[styles.deckBase1, { position: 'absolute' }]}>
                        <CardComponent card={seq[0]} isFaceUp={false} compact />
                      </View>
                      <View style={styles.deckTop}>
                        <CardComponent card={seq[0]} isFaceUp={false} compact />
                      </View>
                      <View style={styles.remainingDeckBadge}>
                        <Text style={styles.remainingDeckText}>{seq.length}</Text>
                      </View>
                    </View>
                  ) : isRevealing ? (
                    // Reveal animation: flip cards face-up with staggered delay
                    seq.map((card, cIdx) => (
                      <RevealSequenceCard
                        key={card.id}
                        card={card}
                        index={cIdx}
                        isExpanded={isExpanded}
                      />
                    ))
                  ) : (
                    seq.map((card, cIdx) => (
                      <AnimatedSequenceCard
                        key={card.id}
                        card={card}
                        index={cIdx}
                        isExpanded={isExpanded}
                        isClosed={showClosed}
                      />
                    ))
                  )}
                </View>
              </View>
              {isExpanded && hints && revealed && (
                <View style={styles.hintPanel}>
                  <Text style={styles.hintTitle}>📌 {t.cardsToEnter}</Text>
                  <View style={styles.hintRow}>
                    {hints.canAddLeft && (
                      <View style={styles.hintChip}>
                        <Text style={styles.hintArrow}>← </Text>
                        <Text style={styles.hintCard}>{hints.canAddLeft}</Text>
                        <Text style={styles.hintLabel}> ({t.starting})</Text>
                      </View>
                    )}
                    {hints.canAddRight && (
                      <View style={styles.hintChip}>
                        <Text style={styles.hintCard}>{hints.canAddRight}</Text>
                        <Text style={styles.hintArrow}> →</Text>
                        <Text style={styles.hintLabel}> ({t.ending})</Text>
                      </View>
                    )}
                    <View style={styles.hintChip}>
                      <Text style={styles.hintCard}>🃏 Joker</Text>
                      <Text style={styles.hintLabel}> ({t.always})</Text>
                    </View>
                  </View>
                  {!hints.canAddLeft && !hints.canAddRight && (
                    <Text style={styles.hintNote}>{t.onlyJoker}</Text>
                  )}
                </View>
              )}
            </Pressable>
          );
        })}
        </View>
      ) : (
        <View style={styles.emptyTable}>
          <Text style={styles.emptyTableEmoji}>🃏</Text>
          <Text style={styles.emptyTableText}>{t.noSequences}</Text>
          <Text style={styles.emptyTableHint}>{t.playHint}</Text>
        </View>
      )}
    </ScrollView>
  );
}
