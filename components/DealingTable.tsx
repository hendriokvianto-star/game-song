import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing, ReduceMotion } from 'react-native-reanimated';
import { useGameStore } from '../store/gameStore';
import { translations } from '../logic/i18n';
import { styles } from '../app/styles';
import { CardComponent } from './Card';
import { useShallow } from 'zustand/react/shallow';

function SingleFlyingCard({ playerIndex }: { playerIndex: number }) {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    // Human goes down (Y: +350), Bots go up (Y: -350)
    const targetY = playerIndex === 0 ? 350 : -350;
    // Bots spread horizontally
    let targetX = 0;
    if (playerIndex === 1) targetX = -150;
    if (playerIndex === 2) targetX = -50;
    if (playerIndex === 3) targetX = 50;
    if (playerIndex === 4) targetX = 150;

    translateY.value = withTiming(targetY, { duration: 600, easing: Easing.out(Easing.ease), reduceMotion: ReduceMotion.Never });
    translateX.value = withTiming(targetX, { duration: 600, easing: Easing.out(Easing.ease), reduceMotion: ReduceMotion.Never });
    scale.value = withTiming(0.4, { duration: 600, reduceMotion: ReduceMotion.Never });
    opacity.value = withDelay(500, withTiming(0, { duration: 100, reduceMotion: ReduceMotion.Never }));
  }, [playerIndex]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value }
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.flyingCardContainer, animStyle]}>
      <CardComponent card={{ id: 'dummy', suit: 'none', value: 0, rank: '2', isJoker: false }} isFaceUp={false} compact />
    </Animated.View>
  );
}

function FlyingCardsContainer({ dealtCount }: { dealtCount: number }) {
  if (dealtCount === 0) return null;
  const cards = [];
  for (let i = Math.max(1, dealtCount - 7); i <= dealtCount; i++) {
    cards.push(<SingleFlyingCard key={i} playerIndex={(i - 1) % 5} />);
  }
  return <>{cards}</>;
}

export function DealingTable() {
  const { cardsDealt, language, skipDeal } = useGameStore(useShallow(state => ({
    cardsDealt: state.cardsDealt,
    language: state.language,
    skipDeal: state.skipDeal
  })));
  const t = translations[language];
  
  return (
    <View style={[StyleSheet.absoluteFillObject, { pointerEvents: 'box-none', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }]}>
      <View style={styles.deckCenterWrapper}>
        <View style={[styles.flyingCardContainer, styles.deckBase2]}>
          <CardComponent card={{ id: 'd2', suit: 'none', value: 0, rank: '2', isJoker: false }} isFaceUp={false} compact />
        </View>
        <View style={[styles.flyingCardContainer, styles.deckBase1]}>
          <CardComponent card={{ id: 'd1', suit: 'none', value: 0, rank: '2', isJoker: false }} isFaceUp={false} compact />
        </View>
        <View style={[styles.flyingCardContainer, styles.deckTop]}>
          <CardComponent card={{ id: 'd0', suit: 'none', value: 0, rank: '2', isJoker: false }} isFaceUp={false} compact />
        </View>

        <FlyingCardsContainer dealtCount={cardsDealt} />
      </View>
      
      <Text style={[styles.emptyTableText, {marginTop: 90, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12}]}>
        {t.dealingCards} {cardsDealt}/100
      </Text>
      
      <Pressable 
        onPress={skipDeal} 
        style={{ marginTop: 16, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }}
      >
        <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>{t.skipDeal}</Text>
      </Pressable>
    </View>
  );
}

export function RemainingDeck() {
  const { deck } = useGameStore(useShallow(state => ({ deck: state.deck })));
  if (deck.length === 0) return null;

  return (
    <View style={styles.remainingDeckContainer}>
      <View style={[styles.flyingCardContainer, { transform: [{translateY: 4}, {translateX: -2}] }]}>
        <CardComponent card={{ id: 'rd2', suit: 'none', value: 0, rank: '2', isJoker: false }} isFaceUp={false} compact />
      </View>
      <View style={[styles.flyingCardContainer, { transform: [{translateY: 2}, {translateX: -1}] }]}>
        <CardComponent card={{ id: 'rd1', suit: 'none', value: 0, rank: '2', isJoker: false }} isFaceUp={false} compact />
      </View>
      <View style={styles.flyingCardContainer}>
        <CardComponent card={{ id: 'rd0', suit: 'none', value: 0, rank: '2', isJoker: false }} isFaceUp={false} compact />
      </View>
      <View style={styles.remainingDeckBadge}>
        <Text style={styles.remainingDeckText}>{deck.length}</Text>
      </View>
    </View>
  );
}
