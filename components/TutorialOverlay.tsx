import React from 'react';
import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, FadeInDown, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGameStore } from '../store/gameStore';
import { translations } from '../logic/i18n';
import { styles } from '../app/styles';
import { useShallow } from 'zustand/react/shallow';

export function TutorialOverlay() {
  const { tutorialStep, nextTutorialStep, closeTutorial, language } = useGameStore(useShallow(state => ({
    tutorialStep: state.tutorialStep,
    nextTutorialStep: state.nextTutorialStep,
    closeTutorial: state.closeTutorial,
    language: state.language
  })));
  const t = translations[language];
  const { width: screenW, height: screenH } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isLandscape = screenW > screenH && screenW < 1024;
  
  if (tutorialStep === null) return null;

  const currentStep = t.tutorialSteps[tutorialStep];
  if (!currentStep) {
    closeTutorial();
    return null;
  }

  // ── Usable area (after safe area insets) ──
  const usableLeft = insets.left;
  const usableRight = insets.right;
  const usableTop = insets.top;

  // ── Layout heights (matching actual component dimensions) ──
  // Header: paddingVertical 2/8 + text 12/18 + border 1
  const headerH = isLandscape ? 17 : 36;
  // OpponentsRow: paddingVertical 1/10 + badge(padding 3/8 + header ~16 + cardCount ~18 + gap)
  const botsH = isLandscape ? 40 : 90;
  // StatusBar: paddingVertical 2/4 + text 10/11
  const statusH = isLandscape ? 14 : 20;
  const humanHeaderH = isLandscape ? 28 : 48;
  const handH = isLandscape ? 100 : 130;

  const botsTop = usableTop + headerH;
  const tableTop = botsTop + botsH + statusH;
  const tableH = screenH - usableTop - tableTop + usableTop - humanHeaderH - handH;
  const humanHeaderBottom = handH;
  const handBottom = 0;

  // Bottom offset where action buttons area starts
  const buttonsBottom = handH + (isLandscape ? 4 : 20); // matches humanArea paddingBottom
  const buttonsHeight = humanHeaderH;

  let highlightStyle: any = {};
  let boxPosition: any = {};

  switch (tutorialStep) {
    case 0:
      // Welcome — no highlight, center box
      boxPosition = { top: '30%' };
      break;
    case 1:
      // Bot opponents — full width strip at top (with extra padding for tolerance)
      highlightStyle = { 
        top: botsTop - 4, 
        height: botsH + 8, 
        left: usableLeft + 4, 
        right: usableRight + 4, 
        borderRadius: 10 
      };
      boxPosition = isLandscape 
        ? { top: botsTop + botsH + 12 } 
        : { top: botsTop + botsH + 16 };
      break;
    case 2:
      // Table area — center section
      highlightStyle = { 
        top: tableTop, 
        bottom: buttonsBottom + buttonsHeight, 
        left: usableLeft, 
        right: usableRight, 
        borderRadius: 12 
      };
      boxPosition = isLandscape 
        ? { top: tableTop + 8 } 
        : { top: tableTop + 8 };
      break;
    case 3:
      // Your hand (cards) — bottom strip
      highlightStyle = { 
        bottom: isLandscape ? 4 : 20, 
        height: handH, 
        left: usableLeft, 
        right: usableRight, 
        borderRadius: 8 
      };
      boxPosition = { bottom: buttonsBottom + buttonsHeight + 12 };
      break;
    case 4:
      // Hint button — highlight right side where buttons are (leftmost button)
      highlightStyle = { 
        bottom: buttonsBottom, 
        height: buttonsHeight, 
        right: usableRight + (isLandscape ? 100 : 140),
        left: screenW * (isLandscape ? 0.58 : 0.5),
        borderRadius: 20 
      };
      boxPosition = { bottom: buttonsBottom + buttonsHeight + 12 };
      break;
    case 5:
      // Pass button — highlight middle button area
      highlightStyle = { 
        bottom: buttonsBottom, 
        height: buttonsHeight, 
        right: usableRight + (isLandscape ? 50 : 70),
        left: screenW * (isLandscape ? 0.68 : 0.62),
        borderRadius: 20 
      };
      boxPosition = { bottom: buttonsBottom + buttonsHeight + 12 };
      break;
    case 6:
      // Play button — highlight rightmost button area
      highlightStyle = { 
        bottom: buttonsBottom, 
        height: buttonsHeight, 
        right: usableRight,
        left: screenW * (isLandscape ? 0.82 : 0.78),
        borderRadius: 20 
      };
      boxPosition = { bottom: buttonsBottom + buttonsHeight + 12 };
      break;
  }

  const totalSteps = t.tutorialSteps.length;

  return (
    <View style={styles.tutorialOverlay}>
      <Pressable style={styles.tutorialBackdrop} onPress={closeTutorial} />
      
      {tutorialStep > 0 && (
        <Animated.View 
          entering={FadeIn.duration(400)} 
          layout={LinearTransition}
          style={[styles.tutorialHighlight, highlightStyle]} 
        >
          <View style={styles.highlightPulse} />
        </Animated.View>
      )}

      <Animated.View 
        entering={FadeInDown} 
        layout={LinearTransition}
        style={[
          styles.tutorialBox,
          { maxWidth: isLandscape ? 300 : 360, padding: isLandscape ? 16 : 28 },
          boxPosition
        ]}
      >
        <View style={styles.tutorialHeader}>
          <Text style={styles.tutorialStepCount}>{language === 'id' ? 'Langkah' : 'Step'} {tutorialStep + 1} / {totalSteps}</Text>
          <Pressable onPress={closeTutorial} style={styles.tutorialCloseMini}>
            <Text style={{color: '#95a5a6', fontSize: 18}}>✕</Text>
          </Pressable>
        </View>

        <Text style={[styles.tutorialTitle, isLandscape && { fontSize: 18, marginBottom: 6 }]}>{currentStep.title}</Text>
        <Text style={[styles.tutorialDesc, isLandscape && { fontSize: 13, lineHeight: 20, marginBottom: 14 }]}>{currentStep.desc}</Text>
        
        <View style={styles.tutorialFooter}>
          <Pressable onPress={closeTutorial} style={styles.tutorialSkipBtn}>
            <Text style={styles.tutorialSkipText}>{language === 'id' ? 'Lewati' : 'Skip'}</Text>
          </Pressable>
          <Pressable style={styles.tutorialNextBtn} onPress={nextTutorialStep}>
            <Text style={styles.tutorialNextText}>
              {tutorialStep === totalSteps - 1 ? t.finish : t.next}
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}
