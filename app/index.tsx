import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Dimensions, Platform, BackHandler, Alert, StatusBar, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, FadeInUp, SlideInDown, useAnimatedStyle, withSpring, useSharedValue, withTiming, withDelay, Easing, ReduceMotion, ZoomIn, LinearTransition, FadeOut, ZoomOut } from 'react-native-reanimated';
import { Audio } from 'expo-av';
import { useGameStore } from '../store/gameStore';
import { Hand } from '../components/Hand';
import { translations } from '../logic/i18n';
import * as Haptics from 'expo-haptics';

import { styles, THEMES, isLandscapeMobile } from './styles';
import { AIBot } from '../logic/ai-engine';
import { RulesScreen } from '../components/RulesScreen';
import { GameOverScreen } from '../components/GameOverScreen';
import { WinCeremony } from '../components/WinCeremony';
import { TutorialOverlay } from '../components/TutorialOverlay';
import { AIPlayerBadge } from '../components/AIPlayerBadge';
import { DealingTable, RemainingDeck } from '../components/DealingTable';
import { TableSequences } from '../components/TableSequences';
import { GameStatusBar } from '../components/GameStatusBar';
import { GameLogSidebar } from '../components/GameLogSidebar';
import { CustomDialog } from '../components/CustomDialog';
import { useShallow } from 'zustand/react/shallow';
import { MenuBackground } from '../components/MenuBackground';

export default function GameBoard() {
  const [showRules, setShowRules] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const {
    players, status, currentPlayerIndex, initializeGame,
    playSelectedCards, passTurn, activeSequences, executeAITurn,
    selectedCardIds, ceremonyWinnerId, currentHint, provideHint, clearHint,
    currentTheme, setTheme, sfxTrigger, language, setLanguage,
    tutorialStep, startTutorial
  } = useGameStore();
  const theme = THEMES[currentTheme];
  const t = translations[language];
  const { width: screenW, height: screenH } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isMobile = screenW < 768;

  const soundRef = useRef<Audio.Sound | null>(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);

  const playBGM = async () => {
    if (soundRef.current) return;
    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
        require('../assets/sounds/bgm.mp3'),
        { isLooping: true, volume: 0.3 }
      );
      soundRef.current = newSound;
      await newSound.playAsync();
      setIsMusicPlaying(true);
    } catch (e) {
      console.log('Error playing BGM:', e);
    }
  };

  const toggleMusic = () => {
    if (soundRef.current) {
      soundRef.current.unloadAsync();
      soundRef.current = null;
      setIsMusicPlaying(false);
    } else {
      playBGM();
    }
  };

  useEffect(() => {
    // Hide status bar on mobile to maximize screen
    if (Platform.OS !== 'web') {
      StatusBar.setHidden(true, 'fade');
    }

    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    };
  }, []);

  // Handle Android back button
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (status === 'idle') {
        // On menu screen — exit app normally
        return false;
      }
      // During gameplay — show confirmation dialog
      useGameStore.getState().showDialog(
        language === 'id' ? 'Keluar dari Permainan?' : 'Exit Game?',
        language === 'id' 
          ? 'Progres ronde ini akan hilang. Apakah Anda yakin ingin kembali ke menu utama?' 
          : 'Current round progress will be lost. Are you sure you want to return to the main menu?',
        [
          { text: language === 'id' ? 'Batal' : 'Cancel', style: 'cancel' },
          { 
            text: language === 'id' ? 'Ya, Keluar' : 'Yes, Exit', 
            style: 'destructive', 
            onPress: () => {
              if (soundRef.current) {
                soundRef.current.unloadAsync();
                soundRef.current = null;
                setIsMusicPlaying(false);
              }
              useGameStore.getState().exitToMenu();
            }
          },
        ]
      );
      return true; // Prevent default back behavior
    });

    return () => backHandler.remove();
  }, [status, language]);

  useEffect(() => {
    if (currentHint) {
      const timer = setTimeout(() => {
        clearHint();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [currentHint, clearHint]);

  useEffect(() => {
    async function playSFX() {
      if (!sfxTrigger) return;
      try {
        let source;
        let volume = 0.6;
        /* 
          NOTE: Audio assets are commented out to prevent crash because files don't exist yet.
          To enable, add .mp3 files to assets/sounds/ and uncomment the lines below.
        */
        /*
        switch (sfxTrigger.type) {
          case 'draw': source = require('../assets/sounds/draw.mp3'); break;
          case 'play': source = require('../assets/sounds/play.mp3'); break;
          case 'win': source = require('../assets/sounds/win.mp3'); volume = 1.0; break;
          case 'mati': source = require('../assets/sounds/mati.mp3'); break;
          case 'deal': source = require('../assets/sounds/deal.mp3'); volume = 0.4; break;
          default: return;
        }
        if (source) {
          const { sound: sfx } = await Audio.Sound.createAsync(source, { shouldPlay: true, volume });
          sfx.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish) {
              sfx.unloadAsync();
            }
          });
        }
        */
        console.log('SFX Triggered (Audio files missing):', sfxTrigger.type);
      } catch (e) {
        console.log('Error playing SFX:', e);
      }
    }
    playSFX();
  }, [sfxTrigger]);

  useEffect(() => {
    // Game will wait for user to press Start
  }, []);

  useEffect(() => {
    if (status === 'playing') {
      const currentPlayer = players[currentPlayerIndex];
      if (currentPlayer?.isAI && currentPlayer.finishedOrder === undefined) {
        const timer = setTimeout(() => {
          executeAITurn();
        }, 1200 + Math.random() * 800);
        return () => clearTimeout(timer);
      } else if (!currentPlayer?.isAI && currentPlayer?.finishedOrder === undefined) {
        // Human player's turn: verify if they have ANY valid moves
        const { cardsToPlay } = AIBot.getBestPlayMulti(currentPlayer.hand, activeSequences, !!currentPlayer.hasOpened);
        if (cardsToPlay.length === 0) {
          const timer = setTimeout(() => {
            useGameStore.getState().showDialog(
              t.deadlockAlert,
              t.deadlockMsg,
              [{ text: "OK", onPress: () => useGameStore.getState().eliminateCurrentPlayer() }]
            );
          }, 1500);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [currentPlayerIndex, status, players, activeSequences, executeAITurn]);

  if (showRules) {
    return <RulesScreen onClose={() => setShowRules(false)} />;
  }

  if (showSettings) {
    const isSettingsLandscape = screenW > screenH;
    const themes = [
      { key: 'classic' as const, emoji: '🌿', label: t.themeClassic, color: '#2ecc71' },
      { key: 'luxury' as const, emoji: '🔥', label: t.themeLuxury, color: '#e67e22' },
      { key: 'ocean' as const, emoji: '🌊', label: t.themeOcean, color: '#3498db' },
      { key: 'midnight' as const, emoji: '🌙', label: t.themeMidnight, color: '#95a5a6' },
    ];

    return (
      <View style={[
        styles.loadingScreen, 
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16, paddingHorizontal: 24 }
      ]}>
        <StatusBar hidden />

        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 500, marginBottom: isSettingsLandscape ? 12 : 24 }}>
          <Text style={{ fontSize: isSettingsLandscape ? 20 : 26, fontWeight: '800', color: '#E8D9B0', letterSpacing: 2 }}>⚙️ {t.settings}</Text>
          <Pressable 
            onPress={() => setShowSettings(false)}
            style={({ pressed }) => ({
              backgroundColor: pressed ? 'rgba(232,217,176,0.2)' : 'rgba(232,217,176,0.08)',
              paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
              borderWidth: 1, borderColor: 'rgba(232,217,176,0.2)',
            })}
          >
            <Text style={{ color: '#E8D9B0', fontWeight: '700', fontSize: 13 }}>← {t.settingsBack}</Text>
          </Pressable>
        </View>

        <ScrollView 
          style={{ flex: 1, width: '100%' }} 
          contentContainerStyle={{ 
            maxWidth: 500, alignSelf: 'center', 
            flexDirection: isSettingsLandscape ? 'row' : 'column',
            gap: isSettingsLandscape ? 20 : 0,
            flexWrap: isSettingsLandscape ? 'wrap' : 'nowrap',
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Theme Section */}
          <View style={{ marginBottom: isSettingsLandscape ? 0 : 24, flex: isSettingsLandscape ? 1 : undefined, minWidth: isSettingsLandscape ? 200 : undefined }}>
            <Text style={{ color: 'rgba(232,217,176,0.5)', fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 10, textTransform: 'uppercase' }}>
              {t.settingsTheme}
            </Text>
            <View style={{ gap: 8 }}>
              {themes.map(th => (
                <Pressable
                  key={th.key}
                  onPress={() => setTheme(th.key)}
                  style={({ pressed }) => ({
                    flexDirection: 'row', alignItems: 'center', gap: 12,
                    backgroundColor: currentTheme === th.key ? `${th.color}22` : 'rgba(255,255,255,0.04)',
                    borderWidth: currentTheme === th.key ? 1.5 : 1,
                    borderColor: currentTheme === th.key ? `${th.color}66` : 'rgba(255,255,255,0.08)',
                    borderRadius: 12, paddingHorizontal: 16, paddingVertical: isSettingsLandscape ? 10 : 14,
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  })}
                >
                  <Text style={{ fontSize: 20 }}>{th.emoji}</Text>
                  <Text style={{ 
                    color: currentTheme === th.key ? th.color : 'rgba(255,255,255,0.6)',
                    fontWeight: currentTheme === th.key ? '700' : '500', fontSize: 15,
                  }}>{th.label}</Text>
                  {currentTheme === th.key && (
                    <Text style={{ marginLeft: 'auto', color: th.color, fontSize: 16 }}>✓</Text>
                  )}
                </Pressable>
              ))}
            </View>
          </View>

          {/* Language & Music Section */}
          <View style={{ flex: isSettingsLandscape ? 1 : undefined, minWidth: isSettingsLandscape ? 200 : undefined }}>
            {/* Language */}
            <Text style={{ color: 'rgba(232,217,176,0.5)', fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 10, textTransform: 'uppercase' }}>
              {t.settingsLanguage}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: isSettingsLandscape ? 20 : 24 }}>
              {([['id', '🇮🇩', 'Indonesia'], ['en', '🇬🇧', 'English']] as const).map(([lang, flag, label]) => (
                <Pressable
                  key={lang}
                  onPress={() => setLanguage(lang)}
                  style={({ pressed }) => ({
                    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                    backgroundColor: language === lang ? 'rgba(232,217,176,0.12)' : 'rgba(255,255,255,0.04)',
                    borderWidth: language === lang ? 1.5 : 1,
                    borderColor: language === lang ? 'rgba(232,217,176,0.3)' : 'rgba(255,255,255,0.08)',
                    borderRadius: 12, paddingVertical: isSettingsLandscape ? 10 : 14,
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  })}
                >
                  <Text style={{ fontSize: 18 }}>{flag}</Text>
                  <Text style={{ 
                    color: language === lang ? '#E8D9B0' : 'rgba(255,255,255,0.5)',
                    fontWeight: language === lang ? '700' : '500', fontSize: 14,
                  }}>{label}</Text>
                </Pressable>
              ))}
            </View>

            {/* Music */}
            <Text style={{ color: 'rgba(232,217,176,0.5)', fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 10, textTransform: 'uppercase' }}>
              {t.settingsMusic}
            </Text>
            <Pressable
              onPress={toggleMusic}
              style={({ pressed }) => ({
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                backgroundColor: isMusicPlaying ? 'rgba(46,204,113,0.12)' : 'rgba(255,255,255,0.04)',
                borderWidth: 1,
                borderColor: isMusicPlaying ? 'rgba(46,204,113,0.3)' : 'rgba(255,255,255,0.08)',
                borderRadius: 12, paddingHorizontal: 16, paddingVertical: isSettingsLandscape ? 10 : 14,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              })}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Text style={{ fontSize: 20 }}>{isMusicPlaying ? '🎵' : '🔇'}</Text>
                <Text style={{ color: isMusicPlaying ? '#2ecc71' : 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: 15 }}>
                  BGM
                </Text>
              </View>
              <View style={{
                backgroundColor: isMusicPlaying ? '#2ecc71' : 'rgba(255,255,255,0.15)',
                paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12,
              }}>
                <Text style={{ color: isMusicPlaying ? '#0F1F15' : 'rgba(255,255,255,0.5)', fontWeight: '800', fontSize: 11 }}>
                  {isMusicPlaying ? t.settingsMusicOn : t.settingsMusicOff}
                </Text>
              </View>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Show game board during tutorial steps >= 1
  const isTutorialActive = tutorialStep !== null && tutorialStep > 0;
  const isTutorialStepZero = tutorialStep === 0;

  if (status === 'idle' && !isTutorialActive) {
    const isMenuLandscape = screenW > screenH;

    return (
      <View style={[
        styles.loadingScreen, 
        { paddingTop: insets.top, paddingBottom: insets.bottom, paddingLeft: insets.left, paddingRight: insets.right }
      ]}>
        <StatusBar hidden />

        {/* Modern Animated Gradient Background */}
        <MenuBackground />

        {/* Floating decorative card symbols (kept but with subtle opacity for depth) */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          {['♠', '♥', '♦', '♣', '🃏', '♠', '♥', '♦', '♣'].map((sym, i) => (
            <Animated.Text
              key={i}
              entering={FadeIn.delay(300 + i * 150).duration(1500)}
              style={{
                position: 'absolute',
                fontSize: 24 + (i % 3) * 16,
                color: sym === '♥' || sym === '♦' ? 'rgba(231,76,60,0.12)' : 'rgba(255,255,255,0.06)',
                top: `${10 + (i * 11) % 80}%`,
                left: `${5 + (i * 13) % 85}%`,
                transform: [{ rotate: `${-20 + i * 15}deg` }],
              }}
            >
              {sym}
            </Animated.Text>
          ))}
        </View>

        {/* Main Content — Glassmorphism Container */}
        <View style={[
          isMenuLandscape ? {
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 32,
            width: '90%', maxWidth: 700,
          } : { alignItems: 'center', width: '85%', maxWidth: 360 },
          {
            backgroundColor: 'rgba(20, 40, 28, 0.4)', // Glassmorphism base
            borderRadius: 32,
            padding: isMenuLandscape ? 40 : 40,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.15)',
            overflow: 'hidden',
          }
        ]}>
          {/* Subtle gradient overlay for glass effect instead of harsh line */}
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.02)' }} />

          {/* Title Section */}
          <Animated.View entering={FadeInDown.duration(600)} style={{ alignItems: 'center', flex: isMenuLandscape ? 1 : undefined }}>
            <Animated.Text entering={ZoomIn.delay(200).duration(500)} style={styles.loadingEmoji}>🃏</Animated.Text>
            
            {/* Glowing title box */}
            <View style={{
              borderWidth: 1.5,
              borderColor: 'rgba(232,217,176,0.25)',
              borderRadius: 16,
              paddingHorizontal: 28,
              paddingVertical: 12,
              marginTop: 8,
              backgroundColor: 'rgba(232,217,176,0.04)',
            }}>
              <Text style={[styles.loadingTitle, { fontSize: isMenuLandscape ? 32 : 40 }]}>{t.song}</Text>
            </View>

            <Text style={[styles.loadingSubtitle, { marginTop: 12, fontSize: 13, textAlign: 'center' }]}>Indonesian Card Game</Text>

            {/* Decorative suits row */}
            <Animated.View entering={FadeIn.delay(600).duration(500)} style={{ flexDirection: 'row', gap: 16, marginTop: 14 }}>
              {['♠', '♥', '♦', '♣'].map((s, i) => (
                <Text key={i} style={{ 
                  fontSize: 18, 
                  color: s === '♥' || s === '♦' ? 'rgba(231,76,60,0.5)' : 'rgba(232,217,176,0.35)'
                }}>{s}</Text>
              ))}
            </Animated.View>
          </Animated.View>

          {/* Menu Buttons Section */}
          <Animated.View entering={FadeInUp.delay(400).duration(600)} style={[
            styles.menuContainer, 
            { 
              marginTop: isMenuLandscape ? 0 : 40, 
              gap: isMenuLandscape ? 10 : 14,
              flex: isMenuLandscape ? 1.2 : undefined,
              width: isMenuLandscape ? undefined : '100%',
              maxWidth: 300,
            }
          ]}>
            {/* Start Game — Primary CTA */}
            <Pressable 
              style={({ pressed }) => [
                styles.menuButton, 
                { 
                  backgroundColor: pressed ? '#27ae60' : '#2ecc71',
                  paddingVertical: isMenuLandscape ? 12 : 16,
                  borderWidth: 1.5,
                  borderColor: 'rgba(46,204,113,0.4)',
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                },
              ]} 
              onPress={() => { playBGM(); initializeGame(); }}
            >
              <Text style={[styles.menuButtonText, { fontSize: isMenuLandscape ? 16 : 18 }]}>▶ {t.startGame}</Text>
            </Pressable>

            {/* Rules — Secondary */}
            <Pressable 
              style={({ pressed }) => [
                styles.menuButton, 
                { 
                  backgroundColor: pressed ? 'rgba(52,152,219,0.3)' : 'rgba(52,152,219,0.15)', 
                  borderWidth: 1, 
                  borderColor: 'rgba(52,152,219,0.4)',
                  paddingVertical: isMenuLandscape ? 10 : 14,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                }
              ]} 
              onPress={() => setShowRules(true)}
            >
              <Text style={[styles.menuButtonText, { fontSize: isMenuLandscape ? 14 : 16, color: '#5dade2' }]}>📜 {t.gameRules}</Text>
            </Pressable>

            {/* Tutorial — Tertiary */}
            <Pressable 
              style={({ pressed }) => [
                styles.menuButton, 
                { 
                  backgroundColor: pressed ? 'rgba(241,196,15,0.25)' : 'rgba(241,196,15,0.1)', 
                  borderWidth: 1, 
                  borderColor: 'rgba(241,196,15,0.3)',
                  paddingVertical: isMenuLandscape ? 10 : 14,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                }
              ]} 
              onPress={() => { playBGM(); startTutorial(); }}
            >
              <Text style={[styles.menuButtonText, { fontSize: isMenuLandscape ? 14 : 16, color: '#f1c40f' }]}>💡 Tutorial</Text>
            </Pressable>

            {/* Settings */}
            <Pressable 
              style={({ pressed }) => [
                styles.menuButton, 
                { 
                  backgroundColor: pressed ? 'rgba(232,217,176,0.2)' : 'rgba(232,217,176,0.08)', 
                  borderWidth: 1, 
                  borderColor: 'rgba(232,217,176,0.2)',
                  paddingVertical: isMenuLandscape ? 10 : 14,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                }
              ]} 
              onPress={() => setShowSettings(true)}
            >
              <Text style={[styles.menuButtonText, { fontSize: isMenuLandscape ? 14 : 16, color: '#E8D9B0' }]}>⚙️ {t.settings}</Text>
            </Pressable>

            {/* Exit — Minimal danger */}
            <Pressable 
              style={({ pressed }) => [
                styles.menuButton, 
                { 
                  backgroundColor: pressed ? 'rgba(231,76,60,0.25)' : 'rgba(231,76,60,0.08)', 
                  borderWidth: 1, 
                  borderColor: 'rgba(231,76,60,0.25)',
                  paddingVertical: isMenuLandscape ? 8 : 12,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                }
              ]} 
              onPress={() => {
                if (Platform.OS === 'android') {
                  BackHandler.exitApp();
                } else {
                  alert("Gunakan tombol Home perangkat Anda untuk keluar.");
                }
              }}
            >
              <Text style={[styles.menuButtonText, { fontSize: isMenuLandscape ? 13 : 14, color: 'rgba(231,76,60,0.7)' }]}>🚪 {t.exit}</Text>
            </Pressable>
          </Animated.View>
        </View>

        {/* Footer */}
        <Animated.Text 
          entering={FadeIn.delay(1000).duration(500)}
          style={{ position: 'absolute', bottom: insets.bottom + 12, color: 'rgba(232,217,176,0.15)', fontSize: 10 }}
        >
          v1.0 • Card Game
        </Animated.Text>

        {tutorialStep !== null && <TutorialOverlay />}
      </View>
    );
  }

  const humanPlayer = players.find(p => !p.isAI);
  const aiPlayers = players.filter(p => p.isAI);
  const isHumanTurn = currentPlayerIndex === players.findIndex(p => !p.isAI);
  const isHumanFinished = humanPlayer?.finishedOrder !== undefined;
  const hasSelection = selectedCardIds.length > 0;

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: theme.background,
        paddingTop: insets.top,
        paddingBottom: insets.bottom
      }
    ]}>
      <StatusBar hidden />
      <View style={styles.mainRow}>
        <View style={styles.mainContent}>
          <View style={[styles.header, { 
            paddingLeft: Math.max(insets.left, isLandscapeMobile ? 10 : 16),
            paddingRight: Math.max(insets.right, isLandscapeMobile ? 10 : 16)
          }]}>
            <Text style={styles.headerTitle}>🃏 Song</Text>
            <GameStatusBar />
            <View style={styles.headerRight}>
              <Text style={styles.seqCount}>{activeSequences.length} {t.seq}</Text>
              <Pressable onPress={() => setShowLog(true)} style={styles.openLogBtn}>
                <Text style={styles.openLogText}>📜 {showLog ? t.close : t.log}</Text>
              </Pressable>
            </View>
          </View>

      {/* AI Opponents Row */}
      <View style={[styles.opponentsRow, {
        paddingLeft: Math.max(insets.left, isLandscapeMobile ? 3 : 8),
        paddingRight: Math.max(insets.right, isLandscapeMobile ? 3 : 8)
      }]}>
        {aiPlayers.map((ai) => (
          <AIPlayerBadge
            key={ai.id}
            player={ai}
            isActive={currentPlayerIndex === players.findIndex(p => p.id === ai.id)}
            t={t}
          />
        ))}
      </View>

      {/* Hint Notification Overlay */}
      {currentHint && (
        <Animated.View entering={FadeInUp.springify()} exiting={FadeOut.duration(300)} style={styles.hintNotification}>
          <Text style={styles.hintNotificationText}>{currentHint.message}</Text>
          <Pressable onPress={clearHint} style={styles.hintCloseBtn}>
            <Text style={styles.hintCloseText}>✕</Text>
          </Pressable>
        </Animated.View>
      )}

      {/* Table — Sequences */}
      <View style={[styles.tableArea, { backgroundColor: theme.primary + '99', borderColor: theme.border }]}>
        {status !== 'dealing' && (
          <>
            <RemainingDeck />
            <TableSequences />
          </>
        )}
      </View>

      {/* Human Player Area */}
      {humanPlayer && (
        <Animated.View entering={SlideInDown.duration(500)} style={[styles.humanArea, {
          paddingLeft: Math.max(insets.left, isLandscapeMobile ? 8 : 16),
          paddingRight: Math.max(insets.right, isLandscapeMobile ? 8 : 16)
        }]}>
          {/* Player Info & Action Buttons */}
          <View style={styles.humanHeader}>
            <View style={styles.humanInfo}>
              <Text style={[styles.humanName, isHumanTurn && styles.humanNameActive]}>
                {isHumanFinished ? `✅ ${t.finished}` : `${humanPlayer.name} • ${humanPlayer.hand.length} ${t.cards}`}
              </Text>
              <View style={styles.humanScoreBadge}>
                <Text style={styles.humanScoreText}>{humanPlayer.totalScore} {t.pts}</Text>
              </View>
              {isHumanTurn && !isHumanFinished && (
                <Text style={styles.yourTurnBadge}>{t.yourTurn}</Text>
              )}
            </View>

            {!isHumanFinished && (
              <View style={styles.actionButtons}>
                <Pressable
                  style={[styles.actionBtn, styles.hintBtnStyle, (!isHumanTurn || status === 'dealing') && styles.actionBtnDisabled]}
                  onPress={provideHint}
                  disabled={!isHumanTurn || status === 'dealing'}
                >
                  <Text style={styles.actionBtnText}>{t.hint}</Text>
                </Pressable>

                <Pressable
                  style={[styles.actionBtn, styles.passBtnStyle, (!isHumanTurn || status === 'dealing') && styles.actionBtnDisabled]}
                  onPress={() => {
                    useGameStore.getState().showDialog(
                      t.passConfirmTitle,
                      t.passConfirmMsg,
                      [
                        { text: t.cancel, style: 'cancel' },
                        { text: t.confirm, style: 'destructive', onPress: passTurn },
                      ]
                    );
                  }}
                  disabled={!isHumanTurn || status === 'dealing'}
                >
                  <Text style={styles.actionBtnText}>{t.pass}</Text>
                </Pressable>

                <Pressable
                  style={[styles.actionBtn, styles.playBtnStyle, (!isHumanTurn || !hasSelection || status === 'dealing') && styles.actionBtnDisabled]}
                  onPress={() => playSelectedCards()}
                  disabled={!isHumanTurn || !hasSelection || status === 'dealing'}
                >
                  <Text style={styles.actionBtnText}>
                    {t.play}{hasSelection ? ` (${selectedCardIds.length})` : ''}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Hand */}
          <View style={{ opacity: isHumanFinished ? 0.5 : 1, overflow: 'visible' as any }}>
            <Hand cards={humanPlayer.hand} isCurrentPlayer={!isHumanFinished} />
          </View>
        </Animated.View>
      )}
      </View>
      {/* Game Log Sidebar (Right Side) */}
      {showLog && (
        <>
          <Pressable 
            onPress={() => setShowLog(false)} 
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 99 }} 
          />
          <GameLogSidebar 
            onClose={() => setShowLog(false)} 
            isMusicOn={isMusicPlaying} 
            onToggleMusic={toggleMusic} 
          />
        </>
      )}
      </View>

      {/* Game Over Overlay */}
      {/* Game Over Overlay (Only after ceremony) */}
      {status === 'finished' && !ceremonyWinnerId && <GameOverScreen />}

      {/* Win Ceremony Overlay */}
      {ceremonyWinnerId && <WinCeremony />}

      {/* Global Dealing Animation Layer */}
      {status === 'dealing' && <DealingTable />}

      {/* Tutorial Overlay */}
      {tutorialStep !== null && <TutorialOverlay />}

      {/* Global Custom Dialog Overlay */}
      <CustomDialog />
    </View>
  );
}
