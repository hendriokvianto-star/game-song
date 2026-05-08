import React, { useEffect } from 'react';
import { View, useWindowDimensions } from 'react-native';
import Animated, { 
  ZoomIn, ZoomOut, FadeInUp, FadeInDown, FadeIn, 
  SlideInUp, BounceIn, FadeOut,
  useAnimatedStyle, useSharedValue, withRepeat, 
  withSequence, withTiming, Easing, withDelay
} from 'react-native-reanimated';
import { useGameStore } from '../store/gameStore';
import { translations } from '../logic/i18n';
import { styles } from '../app/styles';
import { useShallow } from 'zustand/react/shallow';

const PARTICLE_EMOJIS = ['✨', '🎉', '🌟', '🃏', '🔥', '💫', '⭐', '🎊', '🏅', '👑', '💎', '🎯'];

function FloatingParticle({ emoji, delay, x, y, size }: { emoji: string; delay: number; x: number; y: number; size: number }) {
  const floatY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    floatY.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(-30, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ), -1, true
    ));
    opacity.value = withDelay(delay, withTiming(1, { duration: 600 }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.Text style={[{ position: 'absolute', left: x, top: y, fontSize: size }, animStyle]}>
      {emoji}
    </Animated.Text>
  );
}

export function WinCeremony() {
  const { ceremonyWinnerId, players, clearCeremony, language } = useGameStore(useShallow(state => ({
    ceremonyWinnerId: state.ceremonyWinnerId,
    players: state.players,
    clearCeremony: state.clearCeremony,
    language: state.language
  })));
  
  const winner = players.find(p => p.id === ceremonyWinnerId);
  const t = translations[language];
  const { width: screenW, height: screenH } = useWindowDimensions();
  const isHumanWinner = winner && !winner.isAI;
  const isJackpot = winner?.pointsGainedThisRound === -250;

  // Glow pulse animation
  const glowScale = useSharedValue(1);
  useEffect(() => {
    glowScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ), -1, true
    );
  }, []);
  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
  }));
  
  useEffect(() => {
    if (ceremonyWinnerId) {
      const timer = setTimeout(() => {
        clearCeremony();
      }, 4500); // Increased from 3500 for more dramatic effect
      return () => clearTimeout(timer);
    }
  }, [ceremonyWinnerId, clearCeremony]);

  if (!winner) return null;

  // Generate scattered particles across the screen
  const particles = Array.from({ length: 16 }, (_, i) => ({
    emoji: PARTICLE_EMOJIS[i % PARTICLE_EMOJIS.length],
    delay: 800 + i * 120,
    x: (i * 73 + 20) % (screenW - 40),
    y: (i * 97 + 30) % (screenH - 60),
    size: 18 + (i % 4) * 8,
  }));

  return (
    <View style={styles.ceremonyOverlay}>
      {/* Scattered floating particles */}
      <View style={styles.particleContainer}>
        {particles.map((p, i) => (
          <FloatingParticle key={i} {...p} />
        ))}
      </View>

      {/* Radial glow backdrop */}
      <Animated.View style={[{
        position: 'absolute',
        width: screenW * 0.8,
        height: screenW * 0.8,
        borderRadius: screenW * 0.4,
        backgroundColor: isHumanWinner ? 'rgba(241,196,15,0.06)' : 'rgba(231,76,60,0.04)',
      }, glowStyle]} />

      {/* Main ceremony card */}
      <Animated.View 
        entering={ZoomIn.duration(800).springify()} 
        exiting={ZoomOut.duration(500)} 
        style={[styles.ceremonyCard, {
          borderColor: isHumanWinner ? '#f1c40f' : '#e74c3c',
          maxWidth: screenW * 0.85,
        }]}
      >
        {/* Top decoration line */}
        <View style={{ 
          position: 'absolute', top: 0, left: 30, right: 30, height: 3, 
          borderBottomLeftRadius: 2, borderBottomRightRadius: 2,
          backgroundColor: isHumanWinner ? '#f1c40f' : '#e74c3c',
          opacity: 0.6,
        }} />

        {/* SONG text with enhanced glow */}
        <Animated.Text entering={ZoomIn.delay(200).springify()} style={[
          styles.ceremonySongText, 
          { color: isHumanWinner ? '#f1c40f' : '#e74c3c' }
        ]}>
          {t.song}
        </Animated.Text>

        {/* Crown or sad emoji */}
        <Animated.Text entering={BounceIn.delay(400)} style={[
          styles.ceremonyEmoji, 
          { fontSize: 72, marginBottom: 4, marginTop: -4 }
        ]}>
          {isJackpot ? '💎' : isHumanWinner ? '👑' : '😤'}
        </Animated.Text>

        {/* Winner / Loser label */}
        <Animated.Text entering={FadeInDown.delay(500)} style={[
          styles.ceremonyTitle,
          { color: isHumanWinner ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.6)' }
        ]}>
          {t.winner}
        </Animated.Text>

        {/* Player name with emphasis */}
        <Animated.Text entering={FadeIn.delay(800)} style={[
          styles.ceremonyName,
          { 
            color: isHumanWinner ? '#f1c40f' : '#fff',
            fontSize: isHumanWinner ? 40 : 32,
          }
        ]}>
          {winner.id === 'p1' ? t.you.toUpperCase() : winner.name.toUpperCase()}
        </Animated.Text>

        {/* Subtitle — Jackpot or finished */}
        <Animated.Text entering={FadeInUp.delay(1000)} style={[
          styles.ceremonySubtitle, 
          isJackpot && { color: '#f1c40f', fontWeight: '900', fontSize: 24 },
          !isJackpot && isHumanWinner && { color: '#2ecc71', fontWeight: '700' },
        ]}>
          {isJackpot ? t.jackpot : t.cardsFinished}
        </Animated.Text>

        {/* Points badge */}
        {winner.pointsGainedThisRound !== undefined && (
          <Animated.View entering={SlideInUp.delay(1300)} style={{
            backgroundColor: 'rgba(0,0,0,0.3)',
            paddingHorizontal: 20,
            paddingVertical: 8,
            borderRadius: 16,
            marginTop: 12,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.1)',
          }}>
            <Animated.Text style={{ 
              color: winner.pointsGainedThisRound < 0 ? '#2ecc71' : '#e74c3c',
              fontSize: 18,
              fontWeight: '900',
              letterSpacing: 1,
            }}>
              {winner.pointsGainedThisRound > 0 ? '+' : ''}{winner.pointsGainedThisRound} pts
            </Animated.Text>
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
}
