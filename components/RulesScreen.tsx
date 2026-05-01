import React from 'react';
import { SafeAreaView, ScrollView, View, Text, Pressable, useWindowDimensions, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGameStore } from '../store/gameStore';
import { translations } from '../logic/i18n';
import { useShallow } from 'zustand/react/shallow';

export function RulesScreen({ onClose }: { onClose: () => void }) {
  const { language } = useGameStore(useShallow(state => ({ language: state.language })));
  const t = translations[language];
  const r = t.rules;
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isLandscape = width > height;

  const sections = [
    [r.s1title, r.s1body], [r.s2title, r.s2body], [r.s3title, r.s3body],
    [r.s4title, r.s4body], [r.s5title, r.s5body], [r.s6title, r.s6body],
  ];

  // Split into 2 columns for landscape
  const mid = Math.ceil(sections.length / 2);
  const col1 = sections.slice(0, mid);
  const col2 = sections.slice(mid);

  return (
    <View style={{
      flex: 1,
      backgroundColor: '#0F1F15',
      paddingTop: insets.top + (isLandscape ? 6 : 16),
      paddingBottom: insets.bottom + (isLandscape ? 6 : 16),
      paddingLeft: insets.left + (isLandscape ? 12 : 20),
      paddingRight: insets.right + (isLandscape ? 12 : 20),
    }}>
      <StatusBar hidden />

      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: isLandscape ? 6 : 16,
      }}>
        <Text style={{
          fontSize: isLandscape ? 18 : 28,
          fontWeight: '800',
          color: '#E8D9B0',
          letterSpacing: 2,
        }}>📜 {t.gameRules}</Text>

        <Pressable
          onPress={onClose}
          style={({ pressed }) => ({
            backgroundColor: pressed ? 'rgba(231,76,60,0.3)' : 'rgba(231,76,60,0.12)',
            paddingHorizontal: 16,
            paddingVertical: isLandscape ? 6 : 8,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: 'rgba(231,76,60,0.3)',
          })}
        >
          <Text style={{ color: 'rgba(231,76,60,0.8)', fontWeight: '700', fontSize: 13 }}>✕ {t.close}</Text>
        </Pressable>
      </View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexDirection: isLandscape ? 'row' : 'column',
          gap: isLandscape ? 16 : 0,
        }}
        showsVerticalScrollIndicator={false}
      >
        {isLandscape ? (
          <>
            {/* Column 1 */}
            <View style={{ flex: 1 }}>
              {col1.map(([title, body], i) => (
                <RuleSection key={i} title={title} body={body} isLandscape={isLandscape} />
              ))}
            </View>
            {/* Column 2 */}
            <View style={{ flex: 1 }}>
              {col2.map(([title, body], i) => (
                <RuleSection key={i + mid} title={title} body={body} isLandscape={isLandscape} />
              ))}
            </View>
          </>
        ) : (
          sections.map(([title, body], i) => (
            <RuleSection key={i} title={title} body={body} isLandscape={isLandscape} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

function RuleSection({ title, body, isLandscape }: { title: string; body: string; isLandscape: boolean }) {
  return (
    <View style={{
      backgroundColor: 'rgba(255,255,255,0.04)',
      borderRadius: 10,
      padding: isLandscape ? 10 : 14,
      marginBottom: isLandscape ? 8 : 12,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.06)',
    }}>
      <Text style={{
        fontSize: isLandscape ? 13 : 16,
        fontWeight: '700',
        color: '#f1c40f',
        marginBottom: isLandscape ? 4 : 8,
      }}>{title}</Text>
      <Text style={{
        fontSize: isLandscape ? 11 : 14,
        color: 'rgba(255,255,255,0.8)',
        lineHeight: isLandscape ? 16 : 22,
      }}>{body}</Text>
    </View>
  );
}
