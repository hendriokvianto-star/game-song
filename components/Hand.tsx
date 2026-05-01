import React, { useCallback } from 'react';
import { View, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, runOnJS, FadeInDown, LinearTransition, withSequence, withTiming
} from 'react-native-reanimated';
import { Card as CardType } from '../logic/types';
import { CardComponent } from './Card';
import { useGameStore } from '../store/gameStore';


interface HandProps {
  cards: CardType[];
  isCurrentPlayer?: boolean;
}

function DraggableCard({
  card, index, totalCards, isSelected, onSelect, onReorder, onPlayDrag, isFaceUp, selectionIndex, isHighlighted, spacing, isLandscape
}: {
  card: CardType;
  index: number;
  totalCards: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onReorder: (from: number, to: number) => void;
  onPlayDrag: (id: string) => boolean;
  isFaceUp: boolean;
  selectionIndex?: number;
  isHighlighted?: boolean;
  spacing: number;
  isLandscape?: boolean;
}) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const shakeOffset = useSharedValue(0);
  const dragThreshold = isLandscape ? -50 : -80;
  const selectedLift = isLandscape ? -8 : -20;

  const doSelect = useCallback(() => onSelect(card.id), [card.id, onSelect]);
  const doReorder = useCallback((f: number, t: number) => onReorder(f, t), [onReorder]);
  const doPlayDrag = useCallback(() => {
    const success = onPlayDrag(card.id);
    if (!success) {
      shakeOffset.value = withSequence(
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }
  }, [card.id, onPlayDrag]);

  const pan = Gesture.Pan()
    .minDistance(5)
    .onStart(() => { isDragging.value = true; })
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY;
    })
    .onEnd(() => {
      if (translateY.value < dragThreshold) {
        runOnJS(doPlayDrag)();
      } else {
        const moved = Math.round(translateX.value / spacing);
        if (moved !== 0) {
          const target = Math.max(0, Math.min(totalCards - 1, index + moved));
          if (target !== index) runOnJS(doReorder)(index, target);
        }
      }
      translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
      translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
      isDragging.value = false;
    });

  const tap = Gesture.Tap().onEnd(() => { runOnJS(doSelect)(); });
  const gesture = Gesture.Exclusive(pan, tap);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value + shakeOffset.value },
      { translateY: translateY.value + (isSelected ? selectedLift : 0) },
      { scale: isDragging.value ? 1.08 : 1 },
    ],
    zIndex: isDragging.value ? 100 : 1,
  }), [isSelected, selectedLift]);

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View 
        style={animStyle}
        entering={FadeInDown.duration(250)}
        layout={LinearTransition.duration(200)}
      >
        <CardComponent card={card} isSelected={isSelected} isFaceUp={isFaceUp} selectionIndex={selectionIndex} isHighlighted={isHighlighted} compact />
      </Animated.View>
    </GestureDetector>
  );
}

export const Hand: React.FC<HandProps> = ({ cards, isCurrentPlayer = false }) => {
  const { toggleCardSelection, selectedCardIds, reorderHand, playDraggedCard, status, currentHint } = useGameStore();
  const { width: screenW, height: screenH } = useWindowDimensions();
  const isLandscape = screenW > screenH && screenH < 500;

  // U1: Dynamic card sizing — match table compact card dimensions
  const CARD_WIDTH = isLandscape ? 36 : 44;
  const MIN_VISIBLE_WIDTH = isLandscape ? 16 : 20;
  
  // Calculate spacing but ensure a minimum visibility for each card
  const containerWidth = screenW - 32;
  const idealSpacing = cards.length > 1 
    ? Math.min(CARD_WIDTH + 4, (containerWidth - CARD_WIDTH) / (cards.length - 1))
    : 0;
  
  const finalSpacing = Math.max(MIN_VISIBLE_WIDTH, idealSpacing);

  return (
    <View style={[styles.container, { height: isLandscape ? 62 : 110, paddingBottom: isLandscape ? 0 : 8, paddingTop: isLandscape ? 10 : 8, paddingHorizontal: isLandscape ? 4 : 12, overflow: 'visible' }]}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={isLandscape}
        contentContainerStyle={[
          styles.handWrapper, 
          { minWidth: '100%', paddingHorizontal: isLandscape ? 4 : 16 }
        ]}
      >
        {cards.map((card, index) => {
          const selIdx = selectedCardIds.indexOf(card.id);
          const selectionIndex = selIdx >= 0 ? selIdx + 1 : undefined;

          return (
            <View 
              key={card.id} 
              style={{ 
                width: index === cards.length - 1 ? CARD_WIDTH : finalSpacing,
                zIndex: index,
              }}
            >
              <DraggableCard
                card={card}
                index={index}
                totalCards={cards.length}
                isSelected={selIdx >= 0}
                onSelect={isCurrentPlayer ? toggleCardSelection : () => {}}
                onReorder={reorderHand}
                onPlayDrag={isCurrentPlayer ? playDraggedCard : () => false}
                isFaceUp={status !== 'dealing'}
                selectionIndex={selectionIndex}
                isHighlighted={currentHint?.cardIds.includes(card.id)}
                spacing={finalSpacing}
                isLandscape={isLandscape}
              />
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 16,
    justifyContent: 'flex-end',
  },
  handWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    width: '100%',
  },
});
