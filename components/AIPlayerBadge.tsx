import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, { useSharedValue, withTiming, useAnimatedStyle, FadeIn } from 'react-native-reanimated';
import { styles } from '../app/styles';
import { Player } from '../logic/types';

export function AIPlayerBadge({ player, isActive, t }: { player: Player; isActive: boolean, t: any }) {
  const isFinished = player.finishedOrder !== undefined;
  const pulseAnim = useSharedValue(0);

  useEffect(() => {
    if (isActive && !isFinished) {
      pulseAnim.value = withTiming(1, { duration: 600 }, () => {
        pulseAnim.value = withTiming(0, { duration: 600 });
      });
      // Continuous pulse loop
      const interval = setInterval(() => {
        pulseAnim.value = withTiming(1, { duration: 600 }, () => {
          pulseAnim.value = withTiming(0, { duration: 600 });
        });
      }, 1200);
      return () => clearInterval(interval);
    } else {
      pulseAnim.value = 0;
    }
  }, [isActive, isFinished]);

  const glowStyle = useAnimatedStyle(() => ({
    borderColor: `rgba(241, 196, 15, ${0.3 + pulseAnim.value * 0.7})`,
    shadowColor: '#f1c40f',
    shadowOpacity: pulseAnim.value * 0.6,
    shadowRadius: 8 + pulseAnim.value * 6,
  }));

  return (
    <Animated.View style={[styles.aiBadge, isActive && styles.aiBadgeActive, isFinished && styles.aiBadgeFinished, isActive && !isFinished && glowStyle]}>
      <View style={styles.aiBadgeHeader}>
        <Text style={styles.aiEmoji}>{isFinished ? '✅' : '🤖'}</Text>
        <Text style={[styles.aiName, isActive && styles.aiNameActive]} numberOfLines={1}>
          {player.name}
        </Text>
      </View>
      {!isFinished && (
        <View style={styles.aiCardCount}>
          <Text style={styles.aiCardCountText}>{player.hand.length}</Text>
          <Text style={styles.aiCardLabel}>{t.cards}</Text>
        </View>
      )}
      <View style={styles.aiScoreBadge}>
        <Text style={styles.aiScoreText}>{player.totalScore} {t.pts}</Text>
      </View>
      {isFinished && (
        <Text style={styles.aiFinishedText}>#{player.finishedOrder}</Text>
      )}
      {isActive && !isFinished && (
        <Animated.View entering={FadeIn.duration(300)} style={styles.thinkingDots}>
          <Text style={styles.thinkingText}>{t.thinking}</Text>
        </Animated.View>
      )}
    </Animated.View>
  );
}
