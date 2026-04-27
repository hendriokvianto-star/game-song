import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInUp, SlideOutDown } from 'react-native-reanimated';
import { useGameStore } from '../store/gameStore';
import { useShallow } from 'zustand/react/shallow';

export function CustomDialog() {
  const { dialogConfig, hideDialog } = useGameStore(useShallow(state => ({
    dialogConfig: state.dialogConfig,
    hideDialog: state.hideDialog
  })));

  if (!dialogConfig) return null;

  return (
    <Animated.View 
      style={styles.overlay}
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
    >
      <Pressable style={StyleSheet.absoluteFill} onPress={hideDialog} />
      
      <Animated.View 
        style={styles.dialogBox}
        entering={SlideInUp.springify().damping(15)}
        exiting={SlideOutDown.duration(200)}
      >
        <Text style={styles.title}>{dialogConfig.title}</Text>
        <Text style={styles.message}>{dialogConfig.message}</Text>
        
        <View style={styles.actionRow}>
          {dialogConfig.actions.map((action, index) => {
            const isCancel = action.style === 'cancel';
            const isDestructive = action.style === 'destructive';
            
            return (
              <Pressable
                key={index}
                style={[
                  styles.button,
                  isCancel ? styles.buttonCancel : isDestructive ? styles.buttonDestructive : styles.buttonDefault
                ]}
                onPress={() => {
                  hideDialog();
                  if (action.onPress) {
                    // Slight delay to allow hide animation to start
                    setTimeout(() => action.onPress!(), 50);
                  }
                }}
              >
                <Text style={[
                  styles.buttonText,
                  isCancel && styles.buttonTextCancel,
                  isDestructive && styles.buttonTextDestructive
                ]}>
                  {action.text}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
    padding: 24,
  },
  dialogBox: {
    backgroundColor: '#1A2E23',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: 'rgba(232,217,176,0.2)',
    ...Platform.select({
      web: { boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.5)' } as any,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 30,
        elevation: 15,
      }
    }),
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f1c40f',
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 22,
    marginBottom: 24,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  buttonCancel: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  buttonDestructive: {
    backgroundColor: '#e74c3c',
  },
  buttonDefault: {
    backgroundColor: '#3498db',
  },
  buttonText: {
    fontWeight: '700',
    fontSize: 14,
    color: '#fff',
  },
  buttonTextCancel: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  buttonTextDestructive: {
    color: '#fff',
  },
});
