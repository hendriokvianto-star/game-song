import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import Animated, { ZoomIn, LinearTransition, useAnimatedStyle, withSpring } from 'react-native-reanimated';
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

    // Optimize: prevent recreating the animation object on every render
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

export function TableSequences() {
  const { activeSequences, language, selectedCardIds, playSelectedCards } = useGameStore(useShallow(state => ({
    activeSequences: state.activeSequences,
    language: state.language,
    selectedCardIds: state.selectedCardIds,
    playSelectedCards: state.playSelectedCards
  })));
  
  const t = translations[language];
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

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
          // P6: Only compute hints when expanded (lazy)
          const hints = isExpanded ? getSequenceHints(seq) : null;

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
                  {seq.map((card, cIdx) => (
                    <AnimatedSequenceCard
                      key={card.id}
                      card={card}
                      index={cIdx}
                      isExpanded={isExpanded}
                      isClosed={isSequenceComplete(seq)}
                    />
                  ))}
                </View>
              </View>
              {isExpanded && hints && (
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
