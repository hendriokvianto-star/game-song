import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Dimensions } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Card as CardType } from '../logic/types';

// Called at render time (not module scope) so it picks up current dimensions
const getIsLandscape = () => {
  const { width, height } = Dimensions.get('window');
  return width > height && width < 1024;
};

interface CardProps {
  card: CardType;
  isSelected?: boolean;
  onPress?: () => void;
  isFaceUp?: boolean;
  compact?: boolean;
  selectionIndex?: number;
  isHighlighted?: boolean;
}

export const CardComponent: React.FC<CardProps> = ({ card, isSelected = false, onPress, isFaceUp = true, compact = false, selectionIndex, isHighlighted = false }) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: withSpring(isSelected ? -20 : 0, { damping: 18, stiffness: 200 }) }
      ]
    };
  });

  const handlePress = () => {
    if (onPress) {
      Haptics.selectionAsync();
      onPress();
    }
  };

  const getColor = () => {
    if (card.rank === 'Joker') return '#e67e22';
    return (card.suit === 'hearts' || card.suit === 'diamonds') ? '#e74c3c' : '#2c3e50';
  };

  const getSuitSymbol = () => {
    switch (card.suit) {
      case 'hearts': return '♥';
      case 'diamonds': return '♦';
      case 'clubs': return '♣';
      case 'spades': return '♠';
      case 'none': return '★';
      default: return '★';
    }
  };

  const landscape = getIsLandscape();
  let cardW = compact ? (landscape ? 36 : 44) : 60;
  let cardH = compact ? (landscape ? 52 : 66) : 90;
  if (!compact && landscape) {
    cardW = 42;
    cardH = 62;
  }

  if (!isFaceUp) {
    return (
      <View style={[styles.card, styles.cardBack, { width: cardW, height: cardH }]}>
        <View style={styles.cardBackPattern}>
          <View style={styles.cardBackDiamond} />
        </View>
      </View>
    );
  }

  if (card.rank === 'Joker') {
    return (
      <Pressable onPress={handlePress}>
        <Animated.View style={[styles.card, styles.jokerCard, animatedStyle, isSelected && styles.selected, isHighlighted && styles.highlighted, { width: cardW, height: cardH }]}>
          <Text style={[styles.rank, styles.jokerText]}>
            🃏
          </Text>
          <Text style={styles.jokerStar}>★</Text>
          {isSelected && selectionIndex !== undefined && (
            <View style={styles.selectionBadge}>
              <Text style={styles.selectionBadgeText}>{selectionIndex}</Text>
            </View>
          )}
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={[
        styles.card, 
        animatedStyle, 
        isSelected && styles.selected, 
        isHighlighted && styles.highlighted,
        card.isDead && styles.deadCard,
        { width: cardW, height: cardH }
      ]}>
        <View style={[styles.cardCorner, card.isDead && styles.deadContent]}>
          <Text style={[styles.rank, { color: card.isDead ? '#7f8c8d' : getColor() }]}>{card.rank}</Text>
          <Text style={[styles.suitSmall, { color: card.isDead ? '#7f8c8d' : getColor() }]}>{getSuitSymbol()}</Text>
        </View>
        <Text style={[styles.suitCenter, { color: card.isDead ? '#7f8c8d' : getColor() }]}>{getSuitSymbol()}</Text>
        {isSelected && selectionIndex !== undefined && (
          <View style={styles.selectionBadge}>
            <Text style={styles.selectionBadgeText}>{selectionIndex}</Text>
          </View>
        )}
        {card.isDead && (
          <View style={styles.deadOverlay} />
        )}
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 60,
    height: 90,
    backgroundColor: '#FFFEF7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0ddd5',
    padding: 4,
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 3,
    marginHorizontal: -6,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0px 2px 4px rgba(0,0,0,0.15)',
    } : {}),
  },
  selected: {
    borderColor: '#3498db',
    borderWidth: 2,
    backgroundColor: '#EBF5FB',
    elevation: 6,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0px 4px 8px rgba(52,152,219,0.3)',
    } : {}),
  },
  highlighted: {
    borderColor: '#f1c40f',
    borderWidth: 2.5,
    backgroundColor: '#FFFDE7',
    elevation: 8,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0px 0px 12px rgba(241,196,15,0.6)',
    } : {}),
  },
  jokerCard: {
    backgroundColor: '#FFF8E1',
    borderColor: '#F0C040',
    borderWidth: 1.5,
  },
  jokerText: {
    color: '#e67e22',
    fontSize: 16,
  },
  jokerStar: {
    fontSize: 28,
    color: '#e67e22',
  },
  cardBack: {
    backgroundColor: '#1a5276',
    borderColor: '#154360',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  cardBackPattern: {
    width: '80%',
    height: '85%',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBackDiamond: {
    width: 16,
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    transform: [{ rotate: '45deg' }],
    borderRadius: 2,
  },
  cardCorner: {
    alignSelf: 'flex-start',
    alignItems: 'center',
  },
  rank: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  suitSmall: {
    fontSize: 10,
    marginTop: -2,
  },
  suitCenter: {
    fontSize: 22,
    marginBottom: 2,
  },
  selectionBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
    elevation: 4,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0px 2px 4px rgba(0,0,0,0.4)',
    } : {}),
  },
  selectionBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  deadCard: {
    backgroundColor: '#ecf0f1',
    borderColor: '#bdc3c7',
  },
  deadContent: {
    opacity: 0.5,
  },
  deadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
  },
});
