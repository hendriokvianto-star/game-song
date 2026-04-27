import React from 'react';
import { View, Text } from 'react-native';
import { useGameStore } from '../store/gameStore';
import { translations } from '../logic/i18n';
import { styles } from '../app/styles';
import { useShallow } from 'zustand/react/shallow';

export function GameStatusBar() {
  const { lastPlayInfo, currentPlayerIndex, players, consecutivePasses, language } = useGameStore(useShallow(state => ({
    lastPlayInfo: state.lastPlayInfo,
    currentPlayerIndex: state.currentPlayerIndex,
    players: state.players,
    consecutivePasses: state.consecutivePasses,
    language: state.language
  })));
  
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
