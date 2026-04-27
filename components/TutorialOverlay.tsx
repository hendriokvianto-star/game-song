import React from 'react';
import { View, Text, Pressable, Dimensions } from 'react-native';
import Animated, { FadeIn, FadeInDown, LinearTransition } from 'react-native-reanimated';
import { useGameStore } from '../store/gameStore';
import { translations } from '../logic/i18n';
import { styles } from '../app/styles';
import { useShallow } from 'zustand/react/shallow';

const { height } = Dimensions.get('window');

export function TutorialOverlay() {
  const { tutorialStep, nextTutorialStep, closeTutorial, language } = useGameStore(useShallow(state => ({
    tutorialStep: state.tutorialStep,
    nextTutorialStep: state.nextTutorialStep,
    closeTutorial: state.closeTutorial,
    language: state.language
  })));
  const t = translations[language];
  
  if (tutorialStep === null) return null;

  const currentStep = t.tutorialSteps[tutorialStep];
  if (!currentStep) {
    closeTutorial();
    return null;
  }

  // Positioning logic for highlights (approximated)
  let highlightStyle: any = {};
  if (tutorialStep === 1) highlightStyle = { top: 60, height: 110, width: '100%', borderRadius: 12 };
  if (tutorialStep === 2) highlightStyle = { top: 180, height: height * 0.35, width: '100%', borderRadius: 12 };
  if (tutorialStep === 3) highlightStyle = { bottom: 100, height: 160, width: '100%', borderRadius: 12 };
  if (tutorialStep === 4) highlightStyle = { bottom: 15, left: 15, width: 90, height: 70, borderRadius: 12 };
  if (tutorialStep === 5) highlightStyle = { bottom: 15, left: 115, width: 90, height: 70, borderRadius: 12 };
  if (tutorialStep === 6) highlightStyle = { bottom: 15, right: 15, width: 130, height: 70, borderRadius: 12 };

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
          tutorialStep === 1 ? { top: 190 } : 
          tutorialStep === 2 ? { top: 20 } : 
          tutorialStep >= 3 && tutorialStep <= 6 ? { bottom: 200 } : { top: '35%' }
        ]}
      >
        <View style={styles.tutorialHeader}>
          <Text style={styles.tutorialStepCount}>{language === 'id' ? 'Langkah' : 'Step'} {tutorialStep + 1} / {totalSteps}</Text>
          <Pressable onPress={closeTutorial} style={styles.tutorialCloseMini}>
            <Text style={{color: '#95a5a6', fontSize: 18}}>✕</Text>
          </Pressable>
        </View>

        <Text style={styles.tutorialTitle}>{currentStep.title}</Text>
        <Text style={styles.tutorialDesc}>{currentStep.desc}</Text>
        
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
