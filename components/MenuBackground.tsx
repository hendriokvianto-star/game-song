import React, { useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  Easing 
} from 'react-native-reanimated';

// Animated Orb for modern glowing background effect
const GlowingOrb = ({ color, size, initialX, initialY, duration, delay }: any) => {
  const translateX = useSharedValue(initialX);
  const translateY = useSharedValue(initialY);
  const scale = useSharedValue(1);

  useEffect(() => {
    // Random gentle movement
    translateX.value = withRepeat(
      withSequence(
        withTiming(initialX + 30, { duration: duration, easing: Easing.inOut(Easing.ease) }),
        withTiming(initialX - 20, { duration: duration * 1.2, easing: Easing.inOut(Easing.ease) }),
        withTiming(initialX, { duration: duration, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    translateY.value = withRepeat(
      withSequence(
        withTiming(initialY - 40, { duration: duration * 1.1, easing: Easing.inOut(Easing.ease) }),
        withTiming(initialY + 20, { duration: duration * 0.9, easing: Easing.inOut(Easing.ease) }),
        withTiming(initialY, { duration: duration, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    scale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: duration * 0.8, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.9, { duration: duration * 1.2, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: duration, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value }
      ]
    };
  });

  return (
    <Animated.View style={[
      {
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity: 0.15,
        filter: Platform.OS === 'web' ? 'blur(60px)' : undefined, // Web blur
      },
      animatedStyle
    ]}>
      {/* Android/iOS fallback for blur using inner gradient if blurRadius is heavy, but we'll use a trick */}
      {Platform.OS !== 'web' && (
        <View style={{ width: '100%', height: '100%', borderRadius: size/2, backgroundColor: color, opacity: 0.8, shadowColor: color, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: size/3, elevation: 10 }} />
      )}
    </Animated.View>
  );
};

export const MenuBackground = () => {
  const { width, height } = useWindowDimensions();
  
  return (
    <View style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={['#07100B', '#112217', '#0A140D']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Modern Glowing Orbs */}
      <GlowingOrb color="#2ecc71" size={width * 0.6} initialX={-width * 0.1} initialY={-height * 0.1} duration={8000} delay={0} />
      <GlowingOrb color="#f1c40f" size={width * 0.5} initialX={width * 0.6} initialY={height * 0.2} duration={12000} delay={2000} />
      <GlowingOrb color="#3498db" size={width * 0.7} initialX={width * 0.2} initialY={height * 0.7} duration={10000} delay={1000} />

      {/* Decorative Grid Overlay to add premium texture */}
      <View style={[StyleSheet.absoluteFill, styles.gridOverlay]} />
    </View>
  );
};

const styles = StyleSheet.create({
  gridOverlay: {
    opacity: 0.03,
    backgroundColor: 'transparent',
    backgroundImage: Platform.OS === 'web' 
      ? 'linear-gradient(rgba(255, 255, 255, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.5) 1px, transparent 1px)' 
      : undefined,
    backgroundSize: Platform.OS === 'web' ? '30px 30px' : undefined,
  }
});
