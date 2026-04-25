import React, { useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, runOnJS, FadeInDown, LinearTransition
} from 'react-native-reanimated';
import { Card as CardType } from '../logic/types';
import { CardComponent } from './Card';
import { useGameStore } from '../store/gameStore';
import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');
const isLandscapeMobile = width > height && width < 1024;

const CARD_SLOT = 44;

interface HandProps {
  cards: CardType[];
  isCurrentPlayer?: boolean;
}

function DraggableCard({
  card, index, totalCards, isSelected, onSelect, onReorder, onPlayDrag, isFaceUp, selectionIndex, isHighlighted
}: {
  card: CardType;
  index: number;
  totalCards: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onReorder: (from: number, to: number) => void;
  onPlayDrag: (id: string) => void;
  isFaceUp: boolean;
  selectionIndex?: number;
  isHighlighted?: boolean;
}) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const isDragging = useSharedValue(false);

  const doSelect = useCallback(() => onSelect(card.id), [card.id, onSelect]);
  const doReorder = useCallback((f: number, t: number) => onReorder(f, t), [onReorder]);
  const doPlayDrag = useCallback(() => onPlayDrag(card.id), [card.id, onPlayDrag]);

  const pan = Gesture.Pan()
    .minDistance(5)
    .onStart(() => { isDragging.value = true; })
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY;
    })
    .onEnd(() => {
      if (translateY.value < -80) {
        runOnJS(doPlayDrag)();
      } else {
        const moved = Math.round(translateX.value / CARD_SLOT);
        if (moved !== 0) {
          const target = Math.max(0, Math.min(totalCards - 1, index + moved));
          if (target !== index) runOnJS(doReorder)(index, target);
        }
      }
      translateX.value = withSpring(0, { damping: 15 });
      translateY.value = withSpring(0, { damping: 15 });
      isDragging.value = false;
    });

  const tap = Gesture.Tap().onEnd(() => { runOnJS(doSelect)(); });
  const gesture = Gesture.Exclusive(pan, tap);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value + (isSelected ? -20 : 0) },
      { scale: isDragging.value ? 1.15 : 1 },
    ],
    zIndex: isDragging.value ? 100 : 1,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View 
        style={animStyle}
        entering={FadeInDown.duration(300).springify()}
        layout={LinearTransition.springify()}
      >
        <CardComponent card={card} isSelected={isSelected} isFaceUp={isFaceUp} selectionIndex={selectionIndex} isHighlighted={isHighlighted} />
      </Animated.View>
    </GestureDetector>
  );
}

export const Hand: React.FC<HandProps> = ({ cards, isCurrentPlayer = false }) => {
  const { toggleCardSelection, selectedCardIds, reorderHand, playDraggedCard, status, currentHint } = useGameStore();

  const CARD_WIDTH = isLandscapeMobile ? 54 : 64;
  const MIN_VISIBLE_WIDTH = isLandscapeMobile ? 24 : 32;
  
  // Calculate spacing but ensure a minimum visibility for each card
  const containerWidth = width - 32;
  const idealSpacing = cards.length > 1 
    ? Math.min(CARD_WIDTH + 4, (containerWidth - CARD_WIDTH) / (cards.length - 1))
    : 0;
  
  const finalSpacing = Math.max(MIN_VISIBLE_WIDTH, idealSpacing);
  const totalContentWidth = cards.length > 0 ? (cards.length - 1) * finalSpacing + CARD_WIDTH : 0;

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.handWrapper, 
          { minWidth: '100%', paddingHorizontal: 16 }
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
                onPlayDrag={isCurrentPlayer ? playDraggedCard : () => {}}
                isFaceUp={status !== 'dealing'}
                selectionIndex={selectionIndex}
                isHighlighted={currentHint?.cardIds.includes(card.id)}
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
    height: isLandscapeMobile ? 110 : 140,
    width: '100%',
    paddingHorizontal: 16,
    justifyContent: 'flex-end',
    paddingBottom: isLandscapeMobile ? 2 : 8,
  },
  handWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    width: '100%',
  },
});
