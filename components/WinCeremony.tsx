import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { ZoomIn, ZoomOut, FadeInUp, FadeInDown, FadeIn } from 'react-native-reanimated';
import { useGameStore } from '../store/gameStore';
import { translations } from '../logic/i18n';
import { styles } from '../app/styles';
import { useShallow } from 'zustand/react/shallow';

export function WinCeremony() {
  const { ceremonyWinnerId, players, clearCeremony, language } = useGameStore(useShallow(state => ({
    ceremonyWinnerId: state.ceremonyWinnerId,
    players: state.players,
    clearCeremony: state.clearCeremony,
    language: state.language
  })));
  
  const winner = players.find(p => p.id === ceremonyWinnerId);
  const t = translations[language];
  
  useEffect(() => {
    if (ceremonyWinnerId) {
      const timer = setTimeout(() => {
        clearCeremony();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [ceremonyWinnerId, clearCeremony]);

  if (!winner) return null;

  return (
    <View style={styles.ceremonyOverlay}>
      <Animated.View 
        entering={ZoomIn.duration(800).springify()} 
        exiting={ZoomOut.duration(500)} 
        style={styles.ceremonyCard}
      >
        <Animated.Text entering={ZoomIn.delay(200)} style={styles.ceremonySongText}>{t.song}</Animated.Text>
        <Animated.Text entering={FadeInUp.delay(300)} style={styles.ceremonyEmoji}>👑</Animated.Text>
        <Animated.Text entering={FadeInDown.delay(500)} style={styles.ceremonyTitle}>{t.winner}</Animated.Text>
        <Animated.Text entering={FadeIn.delay(800)} style={styles.ceremonyName}>{winner.id === 'p1' ? t.you.toUpperCase() : winner.name.toUpperCase()}</Animated.Text>
        <Animated.Text entering={FadeInUp.delay(1000)} style={[styles.ceremonySubtitle, winner.pointsGainedThisRound === -250 && { color: '#f1c40f', fontWeight: '900', fontSize: 24 }]}>
          {winner.pointsGainedThisRound === -250 ? t.jackpot : t.cardsFinished}
        </Animated.Text>
        
        <View style={styles.particleContainer}>
          {['✨', '🎉', '🌟', '🃏', '🔥'].map((emoji, i) => (
            <Animated.Text
              key={i}
              entering={FadeIn.delay(1200 + i * 150).duration(1000)}
              style={[
                styles.ceremonyParticle,
                { 
                  left: i * 60 - 120,
                  top: i % 2 === 0 ? -100 : 100,
                  fontSize: 24 
                }
              ]}
            >
              {emoji}
            </Animated.Text>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}
