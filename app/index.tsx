import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, ScrollView, Dimensions, Platform, BackHandler, Alert, StatusBar } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp, SlideInDown, useAnimatedStyle, withSpring, useSharedValue, withTiming, withDelay, Easing, ReduceMotion, ZoomIn, LinearTransition, FadeOut, ZoomOut } from 'react-native-reanimated';
import { Audio } from 'expo-av';
import { useGameStore } from '../store/gameStore';
import { Hand } from '../components/Hand';
import { CardComponent } from '../components/Card';
import { getSequenceHints } from '../logic/hints';
import { AIBot } from '../logic/ai-engine';
import { isSequenceComplete } from '../logic/combinations';
import { translations } from '../logic/i18n';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');
const isLandscapeMobile = width > height && width < 1024;

const THEMES = {
  classic: { primary: '#1e392a', secondary: '#2ecc71', background: '#0F1F15', border: 'rgba(46,204,113,0.15)' },
  luxury: { primary: '#4a1010', secondary: '#e67e22', background: '#1a0505', border: 'rgba(230,126,34,0.15)' },
  ocean: { primary: '#102a4a', secondary: '#3498db', background: '#050c1a', border: 'rgba(52,152,219,0.15)' },
  midnight: { primary: '#1a1a1a', secondary: '#95a5a6', background: '#0a0a0a', border: 'rgba(149,165,166,0.15)' },
};

function RulesScreen({ onClose }: { onClose: () => void }) {
  const { language } = useGameStore();
  const t = translations[language];

  return (
    <SafeAreaView style={[styles.loadingScreen, { padding: 20 }]}>
      <Text style={styles.loadingTitle}>{t.gameRules}</Text>
      <ScrollView style={{ width: '100%', flex: 1, marginVertical: 20, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: 16 }}>
        <Text style={styles.rulesHeading}>1. Format & Pembagian Kartu (Dealing)</Text>
        <Text style={styles.rulesText}>
          • Jumlah Pemain: 5 Pemain (1 Manusia & 4 AI Bot).{'\n'}
          • Jumlah Dek: 2 Dek Kartu Standar (108 kartu, termasuk 4 Joker).{'\n'}
          • Pembagian: 20 kartu per pemain.{'\n'}
          • Sisa Kartu: 8 kartu sisa diletakkan di meja dan akan dibuka saat Game Over.
        </Text>

        <Text style={styles.rulesHeading}>2. Kombinasi Kartu Valid</Text>
        <Text style={styles.rulesText}>
          • Seri Berurutan (Sequence): Min. 3 kartu kembang sama dan angka berurutan (misal: 3-4-5 Hati).{'\n'}
          • Angka Kembar (Set): Min. 3 kartu angka sama, kembang bebas (misal: 8-8-8).
        </Text>

        <Text style={styles.rulesHeading}>3. Aturan Khusus Kartu As (Ace)</Text>
        <Text style={styles.rulesText}>
          • Low: Bisa diletakkan sebelum angka 2 (A, 2, 3).{'\n'}
          • High: Bisa diletakkan setelah King (Q, K, A).{'\n'}
          • No Wrap-Around: Tidak boleh memutar (K, A, 2 adalah TIDAK SAH).
        </Text>

        <Text style={styles.rulesHeading}>4. Aturan Khusus Kartu Joker</Text>
        <Text style={styles.rulesText}>
          • Wildcard: Joker (dan As Sekop) bisa menggantikan kartu apa saja.{'\n'}
          • Mematikan Set (Dead Set): Meletakkan 1 Joker ke Angka Kembar di meja akan mematikan set tersebut sehingga tidak bisa ditambah kartu lagi.
        </Text>

        <Text style={styles.rulesHeading}>5. Pemblokiran Seri (Sequence Blocking)</Text>
        <Text style={styles.rulesText}>
          Jika ada Angka Kembar di meja (misal Q-Q-Q), pemain dilarang menempelkan 1 kartu Q (atau Joker) untuk memperpanjang seri (misal 9-10-J). Blokir ini dapat dibypass jika menempelkan 2 kartu sekaligus (misal Q dan K).
        </Text>

        <Text style={styles.rulesHeading}>6. Kondisi Menang (Win Condition)</Text>
        <Text style={styles.rulesText}>
          Pemenang adalah pemain pertama yang kartunya habis (0 kartu). Game Over langsung dipicu saat ada pemain yang habis kartunya.
        </Text>
      </ScrollView>
      <Pressable style={styles.menuButton} onPress={onClose}>
        <Text style={styles.menuButtonText}>❌ Close Rules</Text>
      </Pressable>
    </SafeAreaView>
  );
}

function GameOverScreen() {
  const { 
    players, winnerId, restartGame, nextRound, 
    currentRound, matchWinnerId, lastFinishingMeld 
  } = useGameStore();

  const isMatchOver = matchWinnerId !== undefined;
  
  // Sort by finishing order for the round result, but by total score if match is over
  const sorted = isMatchOver 
    ? [...players].sort((a, b) => a.totalScore - b.totalScore)
    : [...players]
      .filter(p => p.finishedOrder !== undefined)
      .sort((a, b) => (a.finishedOrder ?? 99) - (b.finishedOrder ?? 99));

  const winner = players.find(p => p.id === (isMatchOver ? matchWinnerId : winnerId));
  const isHumanWinner = winner && !winner.isAI;

  const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];

  return (
    <Animated.View entering={FadeIn.duration(600)} style={styles.gameOverOverlay}>
      <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.gameOverCard}>
        <Text style={styles.gameOverEmoji}>
          {isMatchOver ? '🏆' : (isHumanWinner ? '🎉' : '😔')}
        </Text>
        <Text style={styles.gameOverTitle}>
          {isMatchOver 
            ? (isHumanWinner ? 'Match Champion!' : `${winner?.name} Champion!`)
            : (isHumanWinner ? 'Round Won!' : `${winner?.name} Won Round!`)
          }
        </Text>
        <Text style={styles.gameOverSubtitle}>
          {isMatchOver ? 'Match Final Standings' : `Round ${currentRound} Results`}
        </Text>

        {!isMatchOver && lastFinishingMeld && lastFinishingMeld.length > 0 && (
          <View style={styles.winningMeldContainer}>
            <Text style={styles.winningMeldTitle}>Finishing Move:</Text>
            <View style={styles.winningMeldRow}>
              {lastFinishingMeld.map(c => (
                <View key={c.id} style={{ marginHorizontal: 2 }}>
                  <CardComponent card={c} isFaceUp compact />
                </View>
              ))}
            </View>
          </View>
        )}

        <ScrollView style={{ width: '100%', flexShrink: 1, marginVertical: 12 }} showsVerticalScrollIndicator={false}>
          <View style={styles.standingsContainer}>
            {sorted.map((player, idx) => (
              <Animated.View
                key={player.id}
                entering={FadeInDown.delay(400 + idx * 100).duration(400)}
                style={[
                  styles.standingRow,
                  idx === 0 && styles.standingRowFirst,
                  player.id === 'p1' && styles.standingRowHuman,
                ]}
              >
                <View style={styles.standingLeft}>
                  <Text style={styles.standingMedal}>{medals[idx] || `${idx + 1}`}</Text>
                  <Text style={[
                    styles.standingName,
                    idx === 0 && styles.standingNameFirst,
                  ]}>
                    {player.name}
                  </Text>
                </View>
                
                <View style={styles.standingRight}>
                  <Text style={styles.standingPoints}>
                    {player.pointsGainedThisRound !== undefined && (
                      <Text style={{ color: player.pointsGainedThisRound < 0 ? '#2ecc71' : '#e74c3c' }}>
                        {player.pointsGainedThisRound > 0 ? '+' : ''}{player.pointsGainedThisRound} 
                      </Text>
                    )}
                    <Text style={styles.standingTotalScore}> ({player.totalScore} total)</Text>
                  </Text>
                </View>
              </Animated.View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.gameOverActions}>
          {isMatchOver ? (
            <Pressable style={styles.restartButton} onPress={restartGame}>
              <Text style={styles.restartButtonText}>🏆 New Match</Text>
            </Pressable>
          ) : (
            <Pressable style={styles.restartButton} onPress={nextRound}>
              <Text style={styles.restartButtonText}>▶ Next Round</Text>
            </Pressable>
          )}
        </View>
      </Animated.View>
    </Animated.View>
  );
}

function WinCeremony() {
  const { ceremonyWinnerId, players, clearCeremony, language } = useGameStore();
  const winner = players.find(p => p.id === ceremonyWinnerId);
  const t = translations[language];
  
  useEffect(() => {
    if (ceremonyWinnerId) {
      const timer = setTimeout(() => {
        clearCeremony();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [ceremonyWinnerId]);

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
        <Animated.Text entering={FadeInUp.delay(1000)} style={styles.ceremonySubtitle}>Kartu telah habis!</Animated.Text>
        
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

function TutorialOverlay() {
  const { tutorialStep, nextTutorialStep, closeTutorial, language } = useGameStore();
  const t = translations[language];
  if (tutorialStep === null) return null;

  const currentStep = t.tutorialSteps[tutorialStep];
  if (!currentStep) {
    closeTutorial();
    return null;
  }

  // Positioning logic for highlights (approximated)
  let highlightStyle: any = {};
  if (tutorialStep === 1) highlightStyle = { top: 60, height: 100, width: '100%' };
  if (tutorialStep === 2) highlightStyle = { top: 160, height: height * 0.35, width: '100%' };
  if (tutorialStep === 3) highlightStyle = { bottom: 100, height: 150, width: '100%' };
  if (tutorialStep === 4) highlightStyle = { bottom: 20, left: 20, width: 80, height: 60 };
  if (tutorialStep === 5) highlightStyle = { bottom: 20, left: 110, width: 80, height: 60 };
  if (tutorialStep === 6) highlightStyle = { bottom: 20, right: 20, width: 120, height: 60 };

  return (
    <View style={styles.tutorialOverlay}>
      <Pressable style={styles.tutorialBackdrop} onPress={closeTutorial} />
      
      {tutorialStep > 0 && (
        <Animated.View 
          entering={FadeIn} 
          style={[styles.tutorialHighlight, highlightStyle]} 
        />
      )}

      <Animated.View 
        entering={FadeInDown} 
        style={[
          styles.tutorialBox,
          tutorialStep === 1 ? { top: 180 } : 
          tutorialStep === 2 ? { top: 220 } : 
          tutorialStep >= 3 ? { bottom: 200 } : { top: '35%' }
        ]}
      >
        <Text style={styles.tutorialTitle}>{currentStep.title}</Text>
        <Text style={styles.tutorialDesc}>{currentStep.desc}</Text>
        
        <View style={styles.tutorialFooter}>
          <Pressable onPress={closeTutorial}>
            <Text style={styles.tutorialSkip}>{t.exit}</Text>
          </Pressable>
          <Pressable style={styles.tutorialNext} onPress={nextTutorialStep}>
            <Text style={styles.tutorialNextText}>
              {tutorialStep === t.tutorialSteps.length - 1 ? t.finish : t.next}
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

function AIPlayerBadge({ player, isActive, t }: { player: any; isActive: boolean, t: any }) {
  const isFinished = player.finishedOrder !== undefined;

  return (
    <View style={[styles.aiBadge, isActive && styles.aiBadgeActive, isFinished && styles.aiBadgeFinished]}>
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
        <View style={styles.thinkingDots}>
          <Text style={styles.thinkingText}>{t.thinking}</Text>
        </View>
      )}
    </View>
  );
}

function AnimatedSequenceCard({ card, index, isExpanded, isClosed }: { card: any, index: number, isExpanded: boolean, isClosed?: boolean }) {
  const animatedStyle = useAnimatedStyle(() => {
    const margin = index > 0 ? (isExpanded ? 8 : -20) : 0;
    return {
      marginLeft: withSpring(margin, { damping: 14, stiffness: 150 })
    };
  }, [isExpanded, index]);

  return (
    <Animated.View 
      style={animatedStyle} 
      entering={ZoomIn.delay(index * 50).duration(400).springify()}
      layout={LinearTransition.springify()}
    >
      <CardComponent card={card} isFaceUp={!isClosed} compact />
    </Animated.View>
  );
}

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

function DealingTable() {
  const { cardsDealt } = useGameStore();
  
  return (
    <View style={[StyleSheet.absoluteFillObject, { pointerEvents: 'none', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }]}>
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
        Dealing Cards... {cardsDealt}/100
      </Text>
    </View>
  );
}

function RemainingDeck() {
  const { deck } = useGameStore();
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

function TableSequences() {
  const { activeSequences, language } = useGameStore();
  const t = translations[language];
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const toggleHint = (idx: number) => {
    setExpandedIdx(prev => (prev === idx ? null : idx));
  };

  return (
    <ScrollView style={styles.tableContainer} horizontal={false} contentContainerStyle={{ flexGrow: 1 }}>
      {activeSequences.length > 0 ? (
        <View style={styles.sequencesWrapContainer}>
        {activeSequences.map((seq, sIdx) => {
          const hints = getSequenceHints(seq);
          const isExpanded = expandedIdx === sIdx;

          return (
            <Pressable key={sIdx} onPress={() => toggleHint(sIdx)}>
              <View style={[styles.sequenceRow, isExpanded && styles.sequenceRowExpanded]}>
                <View style={styles.sequenceBadge}>
                  <Text style={styles.sequenceBadgeText}>Seq {sIdx + 1}</Text>
                  {seq.some(c => c.isDead) && (
                    <View style={styles.deadLabel}>
                      <Text style={styles.deadLabelText}>MATI</Text>
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
                      isClosed={isSequenceComplete(seq) || seq.some(c => c.isDead)}
                    />
                  ))}
                </View>
              </View>
              {isExpanded && (
                <View style={styles.hintPanel}>
                  <Text style={styles.hintTitle}>📌 Kartu yang bisa masuk:</Text>
                  <View style={styles.hintRow}>
                    {hints.canAddLeft && (
                      <View style={styles.hintChip}>
                        <Text style={styles.hintArrow}>← </Text>
                        <Text style={styles.hintCard}>{hints.canAddLeft}</Text>
                        <Text style={styles.hintLabel}> (awal)</Text>
                      </View>
                    )}
                    {hints.canAddRight && (
                      <View style={styles.hintChip}>
                        <Text style={styles.hintCard}>{hints.canAddRight}</Text>
                        <Text style={styles.hintArrow}> →</Text>
                        <Text style={styles.hintLabel}> (akhir)</Text>
                      </View>
                    )}
                    <View style={styles.hintChip}>
                      <Text style={styles.hintCard}>🃏 Joker</Text>
                      <Text style={styles.hintLabel}> (selalu)</Text>
                    </View>
                  </View>
                  {!hints.canAddLeft && !hints.canAddRight && (
                    <Text style={styles.hintNote}>Hanya Joker yang bisa ditambahkan</Text>
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

function GameStatusBar() {
  const { lastPlayInfo, currentPlayerIndex, players, consecutivePasses, language } = useGameStore();
  const t = translations[language];
  const currentPlayer = players[currentPlayerIndex];

  return (
    <View style={styles.statusBar}>
      {lastPlayInfo ? (
        <Text style={styles.statusText}>
          {lastPlayInfo.message}
        </Text>
      ) : consecutivePasses > 0 ? (
        <Text style={styles.statusText}>
          {consecutivePasses} {t.passes}
        </Text>
      ) : (
        <Text style={styles.statusText}>
          {currentPlayer?.name} {t.turn}
        </Text>
      )}
    </View>
  );
}

function GameLogSidebar({ onClose }: { onClose: () => void }) {
  const { playHistory } = useGameStore();
  const scrollViewRef = useRef<ScrollView>(null);

  return (
    <View style={styles.logSidebar}>
      <View style={styles.logSidebarHeader}>
        <Pressable onPress={onClose} style={styles.logCloseBtn}>
          <Text style={styles.logCloseText}>✕ Tutup</Text>
        </Pressable>
        <Text style={styles.logSidebarTitle}>📜 Riwayat</Text>
      </View>
      <ScrollView 
        ref={scrollViewRef}
        style={styles.logScroll} 
        contentContainerStyle={{ paddingBottom: 20 }}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {playHistory.slice().reverse().map((item, idx) => (
          <View key={item.id} style={styles.logItem}>
            <Text style={styles.logTime}>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</Text>
            <Text style={styles.logMessage}>{item.message}</Text>
          </View>
        ))}
        {playHistory.length === 0 && (
          <Text style={styles.logEmpty}>Belum ada riwayat permainan.</Text>
        )}
      </ScrollView>
    </View>
  );
}

export default function GameBoard() {
  const [showRules, setShowRules] = useState(false);
  const [showLog, setShowLog] = useState(true);
  const {
    players, status, currentPlayerIndex, initializeGame,
    playSelectedCards, passTurn, activeSequences, executeAITurn,
    selectedCardIds, ceremonyWinnerId, currentHint, provideHint, clearHint,
    currentTheme, setTheme, sfxTrigger, language, setLanguage,
    tutorialStep, startTutorial
  } = useGameStore();
  const theme = THEMES[currentTheme];
  const t = translations[language];

  const [sound, setSound] = useState<Audio.Sound>();

  useEffect(() => {
    let localSound: Audio.Sound;
    async function playBGM() {
      try {
        /*
        const { sound } = await Audio.Sound.createAsync(
          require('../assets/sounds/bgm.mp3'),
          { isLooping: true, volume: 0.3 }
        );
        localSound = sound;
        setSound(sound);
        await sound.playAsync();
        */
        console.log('BGM logic ready (bgm.mp3 missing)');
      } catch (e) {
        console.log('Error playing BGM:', e);
      }
    }
    // playBGM(); // Disabled until asset exists

    // Hide status bar on mobile to maximize screen
    if (Platform.OS !== 'web') {
      StatusBar.setHidden(true, 'fade');
    }

    return () => {
      if (localSound) {
        localSound.unloadAsync();
      }
    };
  }, []);

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
            Alert.alert(
              "Perhatian",
              "Anda tidak memiliki kartu yang bisa dimainkan (Deadlock). Giliran Anda akan dilewati secara otomatis hingga bot menyelesaikan permainan.",
              [{ text: "OK", onPress: () => useGameStore.getState().eliminateCurrentPlayer() }]
            );
          }, 1500);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [currentPlayerIndex, status, players, activeSequences, executeAITurn]);

  if (status === 'idle') {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <Text style={styles.loadingEmoji}>🃏</Text>
        <Text style={styles.loadingTitle}>{t.song}</Text>
        <Text style={styles.loadingSubtitle}>Indonesian Card Game</Text>

        <View style={styles.menuContainer}>
          <Pressable style={styles.menuButton} onPress={initializeGame}>
            <Text style={styles.menuButtonText}>▶ {t.startGame}</Text>
          </Pressable>

          <Pressable style={[styles.menuButton, { backgroundColor: '#3498db' }]} onPress={() => setShowRules(true)}>
            <Text style={styles.menuButtonText}>📜 {t.gameRules}</Text>
          </Pressable>

          <Pressable style={[styles.menuButton, { backgroundColor: '#9b59b6' }]} onPress={startTutorial}>
            <Text style={styles.menuButtonText}>💡 Tutorial</Text>
          </Pressable>

          <Pressable 
            style={[styles.menuButton, styles.exitButton]} 
            onPress={() => {
              if (Platform.OS === 'android') {
                BackHandler.exitApp();
              } else {
                alert("Gunakan tombol Home perangkat Anda untuk keluar.");
              }
            }}
          >
            <Text style={styles.menuButtonText}>🚪 {t.exit}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (showRules) {
    return <RulesScreen onClose={() => setShowRules(false)} />;
  }

  const humanPlayer = players.find(p => !p.isAI);
  const aiPlayers = players.filter(p => p.isAI);
  const isHumanTurn = currentPlayerIndex === players.findIndex(p => !p.isAI);
  const isHumanFinished = humanPlayer?.finishedOrder !== undefined;
  const hasSelection = selectedCardIds.length > 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.mainRow}>
        <View style={styles.mainContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>🃏 Song</Text>
            <View style={styles.headerRight}>
              <View style={styles.themeSwitcher}>
                <Pressable 
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setLanguage(language === 'id' ? 'en' : 'id');
                  }}
                  style={styles.langBtn}
                >
                  <Text style={styles.langBtnText}>{language.toUpperCase()}</Text>
                </Pressable>
                <View style={{ width: 1, height: 16, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 4 }} />
                {(Object.keys(THEMES) as Array<keyof typeof THEMES>).map((t) => (
                  <Pressable 
                    key={t}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setTheme(t);
                    }}
                    style={[
                      styles.themeOption, 
                      { backgroundColor: THEMES[t].primary },
                      currentTheme === t && styles.themeOptionActive
                    ]} 
                  />
                ))}
              </View>
              <Text style={styles.seqCount}>{activeSequences.length} {t.seq}</Text>
              {!showLog && (
                <Pressable onPress={() => setShowLog(true)} style={styles.openLogBtn}>
                  <Text style={styles.openLogText}>📜 {t.log}</Text>
                </Pressable>
              )}
            </View>
          </View>

      {/* AI Opponents Row */}
      <View style={styles.opponentsRow}>
        {aiPlayers.map((ai) => (
          <AIPlayerBadge
            key={ai.id}
            player={ai}
            isActive={currentPlayerIndex === players.findIndex(p => p.id === ai.id)}
            t={t}
          />
        ))}
      </View>

      {/* Status Bar */}
      <GameStatusBar />

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
        <Animated.View entering={SlideInDown.duration(500)} style={styles.humanArea}>
          {/* Player Info & Action Buttons */}
          <View style={styles.humanHeader}>
            <View style={styles.humanInfo}>
              <Text style={[styles.humanName, isHumanTurn && styles.humanNameActive]}>
                {isHumanFinished ? '✅ Finished' : `${humanPlayer.name} • ${humanPlayer.hand.length} cards`}
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
                  onPress={passTurn}
                  disabled={!isHumanTurn || status === 'dealing'}
                >
                  <Text style={styles.actionBtnText}>{t.pass}</Text>
                </Pressable>

                <Pressable
                  style={[styles.actionBtn, styles.playBtnStyle, (!isHumanTurn || !hasSelection || status === 'dealing') && styles.actionBtnDisabled]}
                  onPress={playSelectedCards}
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
          <View style={{ opacity: isHumanFinished ? 0.5 : 1 }}>
            <Hand cards={humanPlayer.hand} isCurrentPlayer={!isHumanFinished} />
          </View>
        </Animated.View>
      )}
      </View>
      {/* Game Log Sidebar (Right Side) */}
      {showLog && <GameLogSidebar onClose={() => setShowLog(false)} />}
      </View>

      {/* Game Over Overlay */}
      {/* Game Over Overlay (Only after ceremony) */}
      {status === 'finished' && !ceremonyWinnerId && <GameOverScreen />}

      {/* Win Ceremony Overlay */}
      {ceremonyWinnerId && <WinCeremony />}

      {/* Global Dealing Animation Layer */}
      {status === 'dealing' && <DealingTable />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1F15' },
  mainRow: { flex: 1, flexDirection: 'row' },
  mainContent: { flex: 1, flexDirection: 'column' },
  logSidebar: {
    width: isLandscapeMobile ? 200 : 280,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.1)',
    display: 'flex',
    flexDirection: 'column',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    zIndex: 500,
  },
  logSidebarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  logSidebarTitle: { color: '#E8D9B0', fontSize: 16, fontWeight: 'bold' },
  logCloseBtn: { padding: 4 },
  logCloseText: { color: '#e74c3c', fontSize: 14, fontWeight: 'bold' },
  logScroll: { flex: 1, padding: 12 },
  logItem: { marginBottom: 12, backgroundColor: 'rgba(255,255,255,0.05)', padding: 8, borderRadius: 8 },
  logTime: { color: 'rgba(255,255,255,0.4)', fontSize: 10, marginBottom: 4 },
  logMessage: { color: '#fff', fontSize: 13, lineHeight: 18 },
  logEmpty: { color: 'rgba(255,255,255,0.3)', fontSize: 13, textAlign: 'center', marginTop: 20, fontStyle: 'italic' },
  loadingScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F1F15' },
  loadingEmoji: { fontSize: 64, marginBottom: 16 },
  loadingTitle: { fontSize: 32, fontWeight: '800', color: '#E8D9B0', letterSpacing: 4 },
  loadingSubtitle: { fontSize: 14, color: 'rgba(232,217,176,0.5)', marginTop: 8 },
  rulesHeading: { fontSize: 18, fontWeight: 'bold', color: '#f1c40f', marginTop: 16, marginBottom: 8 },
  rulesText: { fontSize: 14, color: '#fff', lineHeight: 22, marginBottom: 8 },
  menuContainer: { marginTop: 60, width: '100%', maxWidth: 280, gap: 16 },
  menuButton: { backgroundColor: '#2ecc71', paddingVertical: 16, borderRadius: 30, alignItems: 'center', elevation: 6 },
  exitButton: { backgroundColor: '#e74c3c' },
  menuButtonText: { color: 'white', fontSize: 18, fontWeight: '800', letterSpacing: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(232,217,176,0.1)' },
  headerTitle: { fontSize: isLandscapeMobile ? 14 : 18, fontWeight: '700', color: '#E8D9B0', letterSpacing: isLandscapeMobile ? 1 : 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  seqCount: { fontSize: 12, color: 'rgba(232,217,176,0.6)', backgroundColor: 'rgba(232,217,176,0.08)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  openLogBtn: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  openLogText: { color: '#E8D9B0', fontSize: 12, fontWeight: 'bold' },
  opponentsRow: { flexDirection: 'row', paddingHorizontal: 8, paddingVertical: isLandscapeMobile ? 4 : 10, gap: isLandscapeMobile ? 4 : 6 },
  aiBadge: { flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', position: 'relative' },
  aiBadgeActive: { backgroundColor: 'rgba(241,196,15,0.08)', borderColor: 'rgba(241,196,15,0.3)' },
  aiBadgeFinished: { opacity: 0.5 },
  aiBadgeHeader: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  aiEmoji: { fontSize: 12 },
  aiName: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.6)', flexShrink: 1 },
  aiNameActive: { color: '#f1c40f' },
  aiCardCount: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  aiCardCountText: { fontSize: isLandscapeMobile ? 14 : 18, fontWeight: '700', color: 'rgba(255,255,255,0.8)' },
  aiCardLabel: { fontSize: 9, color: 'rgba(255,255,255,0.3)' },
  aiFinishedText: { fontSize: 14, fontWeight: '700', color: '#2ecc71' },
  thinkingDots: { marginTop: 2 },
  thinkingText: { fontSize: 9, color: 'rgba(241,196,15,0.6)', fontStyle: 'italic' },
  aiScoreBadge: { position: 'absolute', bottom: -6, right: -6, backgroundColor: '#0F1F15', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(232,217,176,0.2)' },
  aiScoreText: { color: '#E8D9B0', fontSize: 9, fontWeight: 'bold' },
  statusBar: { paddingHorizontal: 16, paddingVertical: 4 },
  statusText: { fontSize: 11, color: 'rgba(232,217,176,0.5)', textAlign: 'center' },
  tableArea: { flex: 1, marginHorizontal: 4, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  tableContainer: { flex: 1, padding: 4 },
  sequencesWrapContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', alignItems: 'flex-start' },
  sequenceRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sequenceRowExpanded: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 4 },
  sequenceBadge: { backgroundColor: 'rgba(46,204,113,0.15)', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, minWidth: 44, alignItems: 'center' },
  sequenceBadgeText: { fontSize: 9, color: '#2ecc71', fontWeight: '600' },
  sequenceCards: { flexDirection: 'row', paddingVertical: 2, paddingRight: 4 },
  emptyTable: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyTableEmoji: { fontSize: 48, marginBottom: 12, opacity: 0.3 },
  emptyTableText: { color: 'rgba(255,255,255,0.25)', fontSize: 14, fontWeight: '500' },
  emptyTableHint: { color: 'rgba(255,255,255,0.12)', fontSize: 11, marginTop: 4 },
  deckCenterWrapper: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  flyingCardContainer: { position: 'absolute', zIndex: 50 },
  deckBase2: { transform: [{ translateY: 4 }, { translateX: -2 }], zIndex: 1 },
  deckBase1: { transform: [{ translateY: 2 }, { translateX: -1 }], zIndex: 2 },
  deckTop: { zIndex: 3 },
  remainingDeckContainer: { position: 'absolute', top: 16, left: 16, width: 44, height: 62, zIndex: 10 },
  remainingDeckBadge: { position: 'absolute', top: -8, right: -8, backgroundColor: '#e74c3c', borderRadius: 12, width: 24, height: 24, justifyContent: 'center', alignItems: 'center', zIndex: 20, borderWidth: 1, borderColor: '#fff' },
  remainingDeckText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  humanArea: { paddingBottom: 16, borderTopWidth: 1, borderTopColor: 'rgba(232,217,176,0.1)' },
  humanHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 },
  humanInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  humanName: { color: 'rgba(255,255,255,0.7)', fontWeight: '600', fontSize: 14 },
  humanNameActive: { color: '#E8D9B0' },
  humanScoreBadge: { backgroundColor: 'rgba(232,217,176,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  humanScoreText: { color: '#E8D9B0', fontSize: 12, fontWeight: 'bold' },
  yourTurnBadge: { fontSize: 9, fontWeight: '800', color: '#0F1F15', backgroundColor: '#f1c40f', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  actionButtons: { flexDirection: 'row', gap: 8 },
  actionBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, minWidth: 60, alignItems: 'center' },
  actionBtnDisabled: { opacity: 0.3 },
  passBtnStyle: { backgroundColor: 'rgba(231,76,60,0.2)', borderWidth: 1, borderColor: 'rgba(231,76,60,0.4)' },
  playBtnStyle: { backgroundColor: 'rgba(46,204,113,0.2)', borderWidth: 1, borderColor: 'rgba(46,204,113,0.4)' },
  actionBtnText: { color: 'white', fontWeight: '700', fontSize: 13 },
  gameOverOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 24, zIndex: 9999 },
  gameOverCard: { backgroundColor: '#1A2E23', borderRadius: 24, padding: 28, width: '100%', maxWidth: 380, maxHeight: '90%', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(232,217,176,0.15)' },
  gameOverEmoji: { fontSize: 56, marginBottom: 8 },
  gameOverTitle: { fontSize: 28, fontWeight: '800', color: '#E8D9B0', marginBottom: 4 },
  gameOverSubtitle: { fontSize: 13, color: 'rgba(232,217,176,0.5)', marginBottom: 20, fontWeight: '500' },
  winningMeldContainer: { backgroundColor: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 16, alignItems: 'center', marginBottom: 16, width: '100%' },
  winningMeldTitle: { color: '#f1c40f', fontSize: 11, fontWeight: 'bold', marginBottom: 8, textTransform: 'uppercase' },
  winningMeldRow: { flexDirection: 'row' },
  standingsContainer: { width: '100%', gap: 6, marginBottom: 24 },
  standingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12 },
  standingRowFirst: { backgroundColor: 'rgba(241,196,15,0.1)', borderWidth: 1, borderColor: 'rgba(241,196,15,0.2)' },
  standingRowHuman: { borderLeftWidth: 3, borderLeftColor: '#3498db' },
  standingMedal: { fontSize: 20, marginRight: 12, width: 30, textAlign: 'center' },
  standingLeft: { flex: 1 },
  standingRight: { alignItems: 'flex-end' },
  standingName: { fontSize: 15, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  standingNameFirst: { color: '#f1c40f' },
  standingOrder: { fontSize: 12, color: 'rgba(255,255,255,0.3)', fontWeight: '500' },
  standingPoints: { fontSize: 14, fontWeight: 'bold', color: '#fff' },
  standingTotalScore: { fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 'normal' },
  gameOverActions: { width: '100%', marginTop: 10, gap: 12, alignItems: 'center' },
  restartButton: { backgroundColor: '#2ecc71', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 30, width: '100%', alignItems: 'center' },
  restartButtonText: { color: 'white', fontWeight: '800', fontSize: 16, letterSpacing: 1 },
  hintPanel: { backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: 12, marginTop: -8, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  hintTitle: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600', marginBottom: 8 },
  hintRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  hintChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  hintCard: { color: '#E8D9B0', fontWeight: '700', fontSize: 13 },
  hintArrow: { color: '#3498db', fontWeight: '800', fontSize: 12 },
  hintLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10, marginLeft: 4 },
  hintNote: { color: 'rgba(231,76,60,0.8)', fontSize: 11, fontStyle: 'italic', marginTop: 8 },
  leftoverCardsSection: { marginTop: 16, width: '100%', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 12 },
  leftoverCardsTitle: { fontSize: 12, fontWeight: 'bold', color: 'rgba(255,255,255,0.3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  leftoverCardsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: -12 },
  leftoverCardWrapper: { transform: [{ scale: 0.8 }] },
  hintBtnStyle: { backgroundColor: 'rgba(241,196,15,0.15)', borderWidth: 1, borderColor: 'rgba(241,196,15,0.4)' },
  hintNotification: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: '#0F1F15',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#f1c40f',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1000,
    elevation: 10,
    shadowColor: '#f1c40f',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  hintNotificationText: { color: '#E8D9B0', fontSize: 14, fontWeight: '700', flex: 1 },
  hintCloseBtn: { padding: 8, marginLeft: 12 },
  hintCloseText: { color: 'rgba(255,255,255,0.4)', fontSize: 18, fontWeight: 'bold' },
  themeSwitcher: { flexDirection: 'row', gap: 6, marginRight: 12, backgroundColor: 'rgba(0,0,0,0.3)', padding: 4, borderRadius: 20 },
  themeOption: { width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  themeOptionActive: { borderColor: '#fff', borderWidth: 2, transform: [{ scale: 1.2 }] },
  langBtn: { paddingHorizontal: 6, paddingVertical: 2, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4 },
  langBtnText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  tutorialOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 9999 },
  tutorialBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)' },
  tutorialHighlight: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#f1c40f',
    backgroundColor: 'rgba(241,196,15,0.1)',
    borderRadius: 8,
  },
  tutorialBox: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  tutorialTitle: { fontSize: 20, fontWeight: 'bold', color: '#2c3e50', marginBottom: 8 },
  tutorialDesc: { fontSize: 16, color: '#34495e', lineHeight: 22, marginBottom: 20 },
  tutorialFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tutorialSkip: { color: '#95a5a6', fontWeight: '600' },
  tutorialNext: { backgroundColor: '#2ecc71', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 },
  tutorialNextText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  ceremonyOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
  },
  ceremonyCard: {
    backgroundColor: '#1A2E23',
    padding: 40,
    borderRadius: 30,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f1c40f',
    shadowColor: '#f1c40f',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  ceremonyEmoji: { fontSize: 80, marginBottom: 10 },
  ceremonySongText: { color: '#f1c40f', fontSize: 64, fontWeight: '900', letterSpacing: 8, textShadowColor: 'rgba(241,196,15,0.5)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 20 },
  ceremonyTitle: { color: 'rgba(255,255,255,0.8)', fontSize: 18, fontWeight: '900', letterSpacing: 4, marginTop: 10 },
  ceremonyName: { color: '#fff', fontSize: 36, fontWeight: '800', marginVertical: 10 },
  ceremonySubtitle: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '500' },
  particleContainer: { position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none' },
  ceremonyParticle: { position: 'absolute' },
  deadLabel: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 2,
  },
  deadLabelText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '900',
  },
});
