import React from 'react';
import { SafeAreaView, ScrollView, View, Text, Pressable } from 'react-native';
import { useGameStore } from '../store/gameStore';
import { translations } from '../logic/i18n';
import { styles } from '../app/styles';
import { useShallow } from 'zustand/react/shallow';

export function RulesScreen({ onClose }: { onClose: () => void }) {
  const { language } = useGameStore(useShallow(state => ({ language: state.language })));
  const t = translations[language];
  const r = t.rules;

  return (
    <SafeAreaView style={[styles.loadingScreen, { padding: 20 }]}>
      <Text style={styles.loadingTitle}>{t.gameRules}</Text>
      <ScrollView style={{ width: '100%', flex: 1, marginVertical: 20, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: 16 }}>
        {[
          [r.s1title, r.s1body], [r.s2title, r.s2body], [r.s3title, r.s3body],
          [r.s4title, r.s4body], [r.s5title, r.s5body], [r.s6title, r.s6body],
        ].map(([title, body], i) => (
          <View key={i}>
            <Text style={styles.rulesHeading}>{title}</Text>
            <Text style={styles.rulesText}>{body}</Text>
          </View>
        ))}
      </ScrollView>
      <Pressable style={styles.menuButton} onPress={onClose}>
        <Text style={styles.menuButtonText}>{t.closeRules}</Text>
      </Pressable>
    </SafeAreaView>
  );
}
