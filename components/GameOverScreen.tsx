import React from 'react';
import { View, Text, ScrollView, Pressable, Platform } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { useGameStore } from '../store/gameStore';
import { translations } from '../logic/i18n';
import { styles } from '../app/styles';
import { CardComponent } from './Card';
import { useShallow } from 'zustand/react/shallow';

export function GameOverScreen() {
  const { 
    players, winnerId, restartGame, nextRound, 
    currentRound, matchWinnerId, lastFinishingMeld, deck, language 
  } = useGameStore(useShallow(state => ({
    players: state.players,
    winnerId: state.winnerId,
    restartGame: state.restartGame,
    nextRound: state.nextRound,
    currentRound: state.currentRound,
    matchWinnerId: state.matchWinnerId,
    lastFinishingMeld: state.lastFinishingMeld,
    deck: state.deck,
    language: state.language
  })));
  
  const t = translations[language];

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
  const rankColors = ['#f1c40f', '#bdc3c7', '#cd6133', 'rgba(255,255,255,0.4)', 'rgba(255,255,255,0.3)'];

  return (
    <Animated.View entering={FadeIn.duration(600)} style={styles.gameOverOverlay}>
      <Animated.View entering={FadeInDown.delay(200).duration(500)} style={[styles.gameOverCard, {
        borderColor: isHumanWinner ? 'rgba(241,196,15,0.25)' : 'rgba(231,76,60,0.2)',
      }]}>
        {/* Top accent bar */}
        <View style={{ 
          position: 'absolute', top: 0, left: 40, right: 40, 
          height: 3, borderRadius: 2,
          backgroundColor: isHumanWinner ? '#f1c40f' : '#e74c3c', 
          opacity: 0.5 
        }} />

        <Animated.Text entering={ZoomIn.delay(300)} style={styles.gameOverEmoji}>
          {isMatchOver ? '🏆' : (isHumanWinner ? '🎉' : '😔')}
        </Animated.Text>
        <Text style={[styles.gameOverTitle, { 
          color: isHumanWinner ? '#f1c40f' : '#E8D9B0' 
        }]}>
          {isMatchOver 
            ? (isHumanWinner ? t.matchChampion : `${winner?.name} ${t.matchChampion}`)
            : (isHumanWinner ? t.roundWon : `${winner?.name} ${t.wonRound}`)
          }
        </Text>
        <Text style={[styles.gameOverSubtitle, {
          backgroundColor: 'rgba(255,255,255,0.05)',
          paddingHorizontal: 14,
          paddingVertical: 4,
          borderRadius: 8,
          overflow: 'hidden',
        }]}>
          {isMatchOver ? t.matchFinal : `${t.roundResults} ${currentRound}`}
        </Text>

        {!isMatchOver && lastFinishingMeld && lastFinishingMeld.length > 0 && (
          <Animated.View entering={FadeInUp.delay(400)} style={[styles.winningMeldContainer, {
            borderWidth: 1,
            borderColor: 'rgba(241,196,15,0.15)',
          }]}>
            <Text style={styles.winningMeldTitle}>{t.finishingMove}</Text>
            <View style={styles.winningMeldRow}>
              {lastFinishingMeld.map(c => (
                <View key={c.id} style={{ marginHorizontal: 2 }}>
                  <CardComponent card={c} isFaceUp compact />
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        <ScrollView style={{ width: '100%', flexShrink: 1, marginVertical: 12 }} showsVerticalScrollIndicator={false}>
          <View style={styles.standingsContainer}>
            {sorted.map((player, idx) => (
              <Animated.View
                key={player.id}
                entering={FadeInDown.delay(400 + idx * 120).duration(400)}
                style={[
                  styles.standingRow,
                  idx === 0 && styles.standingRowFirst,
                  player.id === 'p1' && styles.standingRowHuman,
                  { 
                    borderLeftWidth: idx === 0 ? 3 : (player.id === 'p1' ? 3 : 0),
                    borderLeftColor: idx === 0 ? rankColors[0] : (player.id === 'p1' ? '#3498db' : 'transparent'),
                  }
                ]}
              >
                <View style={[styles.standingLeft, { flexDirection: 'row', alignItems: 'center' }]}>
                  <Text style={[styles.standingMedal, { width: 36, textAlign: 'center' }]}>{medals[idx] || `${idx + 1}`}</Text>
                  <View>
                    <Text style={[
                      styles.standingName,
                      idx === 0 && styles.standingNameFirst,
                      player.id === 'p1' && { color: '#3498db' },
                    ]}>
                      {player.name}
                    </Text>
                    {player.id === 'p1' && (
                      <Text style={{ fontSize: 9, color: 'rgba(52,152,219,0.6)', fontWeight: '600', marginTop: 1 }}>
                        {language === 'id' ? 'Anda' : 'You'}
                      </Text>
                    )}
                  </View>
                </View>
                
                <View style={[styles.standingRight, { flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
                  {/* Round points badge */}
                  {player.pointsGainedThisRound !== undefined && (
                    <View style={{
                      backgroundColor: player.pointsGainedThisRound < 0 
                        ? 'rgba(46,204,113,0.15)' 
                        : 'rgba(231,76,60,0.15)',
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: player.pointsGainedThisRound < 0 
                        ? 'rgba(46,204,113,0.3)' 
                        : 'rgba(231,76,60,0.3)',
                    }}>
                      <Text style={{ 
                        color: player.pointsGainedThisRound < 0 ? '#2ecc71' : '#e74c3c',
                        fontSize: 13,
                        fontWeight: '800',
                      }}>
                        {player.pointsGainedThisRound > 0 ? '+' : ''}{player.pointsGainedThisRound}
                      </Text>
                    </View>
                  )}
                  {/* Total score */}
                  <View>
                    <Text style={[styles.standingPoints, { fontSize: 16 }]}>
                      {player.totalScore}
                    </Text>
                    <Text style={[styles.standingTotalScore, { fontSize: 9 }]}>
                      {t.total}
                    </Text>
                  </View>
                </View>
              </Animated.View>
            ))}
          </View>

          {/* Remaining cards in each player's hand */}
          <Animated.View entering={FadeIn.delay(800)} style={{
            marginTop: 8,
            backgroundColor: 'rgba(0,0,0,0.2)',
            borderRadius: 14,
            padding: 12,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.06)',
          }}>
            <Text style={{
              fontSize: 11,
              fontWeight: '800',
              color: 'rgba(255,255,255,0.3)',
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              marginBottom: 10,
              textAlign: 'center',
            }}>
              {t.remainingHands}
            </Text>

            {players.map((player, pIdx) => (
              <Animated.View 
                key={player.id}
                entering={FadeInDown.delay(900 + pIdx * 80)}
                style={{
                  marginBottom: pIdx < players.length - 1 ? 10 : 0,
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  borderRadius: 10,
                  padding: 8,
                  borderWidth: 1,
                  borderColor: player.id === 'p1' ? 'rgba(52,152,219,0.2)' : 'rgba(255,255,255,0.04)',
                }}
              >
                {/* Player header */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: player.hand.length > 0 ? 6 : 0 }}>
                  <Text style={{ 
                    fontSize: 12, 
                    fontWeight: '700', 
                    color: player.id === 'p1' ? '#3498db' : 'rgba(255,255,255,0.6)' 
                  }}>
                    {player.name}
                  </Text>
                  <View style={{
                    backgroundColor: player.hand.length === 0 
                      ? 'rgba(46,204,113,0.15)' 
                      : 'rgba(231,76,60,0.1)',
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: player.hand.length === 0 
                      ? 'rgba(46,204,113,0.3)' 
                      : 'rgba(231,76,60,0.2)',
                  }}>
                    <Text style={{ 
                      fontSize: 10, 
                      fontWeight: '800',
                      color: player.hand.length === 0 ? '#2ecc71' : '#e74c3c',
                    }}>
                      {player.hand.length === 0 ? `✓ ${t.noCardsLeft}` : `${player.hand.length} ${t.cards}`}
                    </Text>
                  </View>
                </View>

                {/* Cards display */}
                {player.hand.length > 0 && (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: -10, justifyContent: 'center' }}>
                    {player.hand
                      .sort((a, b) => {
                        if (a.isJoker) return 1;
                        if (b.isJoker) return -1;
                        if (a.suit !== b.suit) return a.suit.localeCompare(b.suit);
                        return a.value - b.value;
                      })
                      .map(c => (
                        <View key={c.id} style={{ transform: [{ scale: 0.7 }], marginHorizontal: -4 }}>
                          <CardComponent card={c} isFaceUp compact />
                        </View>
                      ))}
                  </View>
                )}
              </Animated.View>
            ))}
          </Animated.View>

          {deck.length > 0 && (
            <Animated.View entering={FadeIn.delay(900)} style={[styles.leftoverCardsSection, {
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.06)',
            }]}>
              <Text style={styles.leftoverCardsTitle}>
                {t.leftoverCards} ({deck.length})
              </Text>
              <View style={styles.leftoverCardsRow}>
                {deck.map((c, i) => (
                  <View key={c.id} style={styles.leftoverCardWrapper}>
                    <CardComponent card={c} isFaceUp compact />
                  </View>
                ))}
              </View>
            </Animated.View>
          )}
        </ScrollView>

        <View style={styles.gameOverActions}>
          {isMatchOver ? (
            <Pressable 
              style={({ pressed }) => [styles.restartButton, { 
                backgroundColor: pressed ? '#27ae60' : '#2ecc71',
                transform: [{ scale: pressed ? 0.97 : 1 }],
                ...Platform.select({
                  default: { shadowColor: '#2ecc71', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
                  web: {} as any,
                }),
              }]} 
              onPress={restartGame}
            >
              <Text style={styles.restartButtonText}>🏆 {t.newMatch}</Text>
            </Pressable>
          ) : (
            <Pressable 
              style={({ pressed }) => [styles.restartButton, { 
                backgroundColor: pressed ? '#27ae60' : '#2ecc71',
                transform: [{ scale: pressed ? 0.97 : 1 }],
                ...Platform.select({
                  default: { shadowColor: '#2ecc71', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
                  web: {} as any,
                }),
              }]} 
              onPress={nextRound}
            >
              <Text style={styles.restartButtonText}>▶ {t.nextRound}</Text>
            </Pressable>
          )}
        </View>
      </Animated.View>
    </Animated.View>
  );
}
