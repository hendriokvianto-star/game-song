import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
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

  return (
    <Animated.View entering={FadeIn.duration(600)} style={styles.gameOverOverlay}>
      <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.gameOverCard}>
        <Text style={styles.gameOverEmoji}>
          {isMatchOver ? '🏆' : (isHumanWinner ? '🎉' : '😔')}
        </Text>
        <Text style={styles.gameOverTitle}>
          {isMatchOver 
            ? (isHumanWinner ? t.matchChampion : `${winner?.name} ${t.matchChampion}`)
            : (isHumanWinner ? t.roundWon : `${winner?.name} ${t.wonRound}`)
          }
        </Text>
        <Text style={styles.gameOverSubtitle}>
          {isMatchOver ? t.matchFinal : `${t.roundResults} ${currentRound}`}
        </Text>

        {!isMatchOver && lastFinishingMeld && lastFinishingMeld.length > 0 && (
          <View style={styles.winningMeldContainer}>
            <Text style={styles.winningMeldTitle}>{t.finishingMove}</Text>
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
                    <Text style={styles.standingTotalScore}> ({player.totalScore} {t.total})</Text>
                  </Text>
                </View>
              </Animated.View>
            ))}
          </View>

          {deck.length > 0 && (
            <View style={styles.leftoverCardsSection}>
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
            </View>
          )}
        </ScrollView>

        <View style={styles.gameOverActions}>
          {isMatchOver ? (
            <Pressable style={styles.restartButton} onPress={restartGame}>
              <Text style={styles.restartButtonText}>🏆 {t.newMatch}</Text>
            </Pressable>
          ) : (
            <Pressable style={styles.restartButton} onPress={nextRound}>
              <Text style={styles.restartButtonText}>▶ {t.nextRound}</Text>
            </Pressable>
          )}
        </View>
      </Animated.View>
    </Animated.View>
  );
}
