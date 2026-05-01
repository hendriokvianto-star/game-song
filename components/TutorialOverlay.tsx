import React from 'react';
import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, FadeInDown, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGameStore } from '../store/gameStore';
import { translations } from '../logic/i18n';
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
  // Use height-based detection: compact layout when viewport is short (landscape mobile or constrained browser)
  const isLandscape = screenW > screenH && screenH < 500;
  
  if (tutorialStep === null) return null;

  const currentStep = t.tutorialSteps[tutorialStep];
  if (!currentStep) {
    closeTutorial();
    return null;
  }

  const usableLeft = insets.left;
  const usableRight = insets.right;
  const usableTop = insets.top;

  const headerH = isLandscape ? 13 : 36;
  const botsH = isLandscape ? 32 : 90;
  const humanHeaderH = isLandscape ? 28 : 48; // Button bar actual height including padding
  const handH = isLandscape ? 62 : 110;

  const botsTop = usableTop + headerH;
  const tableTop = botsTop + botsH;
  const buttonsBottom = handH + (isLandscape ? 0 : 20);
  const buttonsHeight = humanHeaderH;

  let highlightStyle: any = {};
  let boxPosition: any = {};

  // In landscape: dialog on the right half, positioned from top
  const lsDialog = {
    left: screenW * 0.55,
    right: 16,
    top: usableTop + 8,
  };

  switch (tutorialStep) {
    case 0:
      // Welcome — no highlight, centered
      if (isLandscape) {
        boxPosition = { top: screenH * 0.1, left: screenW * 0.25, right: screenW * 0.25 };
      } else {
        boxPosition = { top: '30%', left: 20, right: 20 };
      }
      break;
    case 1:
      highlightStyle = { 
        top: botsTop - 4, height: botsH + 8, 
        left: usableLeft + 4, right: usableRight + 4, 
        borderRadius: 10 
      };
      boxPosition = isLandscape ? lsDialog : { top: botsTop + botsH + 16, left: 20, right: 20 };
      break;
    case 2:
      highlightStyle = { 
        top: tableTop, bottom: buttonsBottom + buttonsHeight, 
        left: usableLeft, right: usableRight, 
        borderRadius: 12 
      };
      boxPosition = isLandscape ? lsDialog : { top: tableTop + 8, left: 20, right: 20 };
      break;
    case 3:
      highlightStyle = { 
        bottom: isLandscape ? 4 : 20, height: handH, 
        left: usableLeft, right: usableRight, 
        borderRadius: 8 
      };
      boxPosition = isLandscape ? lsDialog : { bottom: buttonsBottom + buttonsHeight + 12, left: 20, right: 20 };
      break;
    case 4:
      highlightStyle = { 
        bottom: buttonsBottom, height: buttonsHeight, 
        right: usableRight + (isLandscape ? 100 : 140),
        left: screenW * (isLandscape ? 0.58 : 0.5),
        borderRadius: 20 
      };
      boxPosition = isLandscape ? lsDialog : { bottom: buttonsBottom + buttonsHeight + 12, left: 20, right: 20 };
      break;
    case 5:
      highlightStyle = { 
        bottom: buttonsBottom, height: buttonsHeight, 
        right: usableRight + (isLandscape ? 50 : 70),
        left: screenW * (isLandscape ? 0.68 : 0.62),
        borderRadius: 20 
      };
      boxPosition = isLandscape ? lsDialog : { bottom: buttonsBottom + buttonsHeight + 12, left: 20, right: 20 };
      break;
    case 6:
      highlightStyle = { 
        bottom: buttonsBottom, height: buttonsHeight, 
        right: usableRight,
        left: screenW * (isLandscape ? 0.82 : 0.78),
        borderRadius: 20 
      };
      boxPosition = isLandscape ? lsDialog : { bottom: buttonsBottom + buttonsHeight + 12, left: 20, right: 20 };
      break;
  }

  const totalSteps = t.tutorialSteps.length;
  const ls = isLandscape; // shorthand

  return (
    <View style={{
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999,
    }}>
      {/* Backdrop */}
      <Pressable 
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)' }} 
        onPress={closeTutorial} 
      />
      
      {/* Highlight */}
      {tutorialStep > 0 && (
        <Animated.View 
          entering={FadeIn.duration(400)} 
          layout={LinearTransition}
          style={[{
            position: 'absolute',
            borderWidth: 2,
            borderColor: '#f1c40f',
            backgroundColor: 'rgba(241,196,15,0.1)',
            borderRadius: 8,
          }, highlightStyle]} 
        >
          <View style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            borderWidth: 3, borderColor: '#f1c40f', borderRadius: 12, opacity: 0.5,
          }} />
        </Animated.View>
      )}

      {/* Dialog Box */}
      <Animated.View 
        entering={FadeInDown.duration(300)} 
        layout={LinearTransition}
        style={[{
          position: 'absolute',
          backgroundColor: '#fff',
          borderRadius: ls ? 14 : 28,
          padding: ls ? 12 : 28,
          maxWidth: ls ? 260 : 360,
          elevation: 30,
          borderWidth: 1.5,
          borderColor: 'rgba(52,152,219,0.15)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.2,
          shadowRadius: 20,
        }, boxPosition]}
      >
        {/* Header row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ls ? 4 : 16 }}>
          <Text style={{ color: '#3498db', fontWeight: '900', fontSize: ls ? 9 : 13, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            {language === 'id' ? 'Langkah' : 'Step'} {tutorialStep + 1} / {totalSteps}
          </Text>
          <Pressable onPress={closeTutorial} style={{ padding: 4 }}>
            <Text style={{ color: '#95a5a6', fontSize: ls ? 13 : 18 }}>✕</Text>
          </Pressable>
        </View>

        {/* Title */}
        <Text style={{ 
          fontSize: ls ? 14 : 26, fontWeight: '900', color: '#2c3e50', 
          marginBottom: ls ? 3 : 12, letterSpacing: -0.5 
        }}>{currentStep.title}</Text>

        {/* Description */}
        <Text style={{ 
          fontSize: ls ? 10 : 16, color: '#576574', 
          lineHeight: ls ? 15 : 26, marginBottom: ls ? 8 : 28 
        }}>{currentStep.desc}</Text>
        
        {/* Footer buttons */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Pressable onPress={closeTutorial} style={{ paddingVertical: ls ? 4 : 12, paddingHorizontal: ls ? 8 : 16 }}>
            <Text style={{ color: '#95a5a6', fontWeight: 'bold', fontSize: ls ? 10 : 14 }}>
              {language === 'id' ? 'Lewati' : 'Skip'}
            </Text>
          </Pressable>
          <Pressable 
            style={{ 
              backgroundColor: '#3498db', 
              paddingHorizontal: ls ? 16 : 32, 
              paddingVertical: ls ? 6 : 14, 
              borderRadius: ls ? 10 : 16,
              elevation: 5,
            }} 
            onPress={nextTutorialStep}
          >
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: ls ? 11 : 16 }}>
              {tutorialStep === totalSteps - 1 ? t.finish : t.next}
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}
