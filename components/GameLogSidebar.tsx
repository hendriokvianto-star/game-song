import React, { useRef } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useGameStore } from '../store/gameStore';
import { translations } from '../logic/i18n';
import { styles, THEMES } from '../app/styles';
import * as Haptics from 'expo-haptics';
import { useShallow } from 'zustand/react/shallow';

export function GameLogSidebar({ onClose, isMusicOn, onToggleMusic }: { 
  onClose: () => void, 
  isMusicOn: boolean, 
  onToggleMusic: () => void 
}) {
  const { playHistory, language, setLanguage, currentTheme, setTheme } = useGameStore(useShallow(state => ({
    playHistory: state.playHistory,
    language: state.language,
    setLanguage: state.setLanguage,
    currentTheme: state.currentTheme,
    setTheme: state.setTheme
  })));
  
  const t = translations[language];
  const scrollViewRef = useRef<ScrollView>(null);

  return (
    <View style={styles.logSidebar}>
      <View style={styles.logSidebarHeader}>
        <Text style={styles.logSidebarTitle}>⚙️ {t.settings} & 📜 {t.log}</Text>
        <Pressable onPress={onClose} style={styles.logCloseBtn}>
          <Text style={styles.logCloseText}>✕</Text>
        </Pressable>
      </View>
      
      {/* Settings Section */}
      <View style={styles.settingsSection}>
        <View style={styles.settingsRow}>
          <Text style={styles.settingsLabel}>{language === 'id' ? 'Bahasa:' : 'Language:'}</Text>
          <Pressable 
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setLanguage(language === 'id' ? 'en' : 'id');
            }}
            style={styles.langBtnLarge}
          >
            <Text style={styles.langBtnTextLarge}>
              {language === 'id' ? '🇮🇩 Bahasa' : '🇺🇸 English'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.settingsRow}>
          <Text style={styles.settingsLabel}>{language === 'id' ? 'Tema:' : 'Theme:'}</Text>
          <View style={styles.themeSwitcherLarge}>
            {(Object.keys(THEMES) as Array<keyof typeof THEMES>).map((tName) => (
              <Pressable 
                key={tName}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setTheme(tName);
                }}
                style={[
                  styles.themeOptionLarge, 
                  { backgroundColor: THEMES[tName as keyof typeof THEMES].primary },
                  currentTheme === tName && styles.themeOptionActive
                ]} 
              />
            ))}
          </View>
        </View>

        <View style={styles.settingsRow}>
          <Text style={styles.settingsLabel}>{language === 'id' ? 'Musik:' : 'Music:'}</Text>
          <Pressable 
            onPress={onToggleMusic}
            style={[styles.musicBtn, isMusicOn && styles.musicBtnActive]}
          >
            <Text style={styles.musicBtnText}>{isMusicOn ? '🔊 ON' : '🔇 OFF'}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.logDivider} />
      <ScrollView 
        ref={scrollViewRef}
        style={styles.logScroll} 
        contentContainerStyle={{ paddingBottom: 20 }}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {playHistory.slice().reverse().map((item) => (
          <View key={item.id} style={styles.logItem}>
            <Text style={styles.logTime}>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</Text>
            <Text style={styles.logMessage}>{item.message}</Text>
          </View>
        ))}
        {playHistory.length === 0 && (
          <Text style={styles.logEmpty}>{t.noHistory}</Text>
        )}
      </ScrollView>
    </View>
  );
}
