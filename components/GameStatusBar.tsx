import React from 'react';
import { Text } from 'react-native';
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

  const statusMsg = lastPlayInfo 
    ? lastPlayInfo.message 
    : consecutivePasses > 0 
      ? `${consecutivePasses} ${t.passes}`
      : `${currentPlayer?.name} ${t.turn}`;

  return (
    <Text style={styles.statusText} numberOfLines={1} ellipsizeMode="tail">
      {statusMsg}
    </Text>
  );
}
