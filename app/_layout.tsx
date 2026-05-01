import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';

export default function Layout() {
  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setVisibilityAsync('hidden').catch(() => {});
      NavigationBar.setBehaviorAsync('overlay-swipe').catch(() => {});
    }
  }, []);

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }} />
        <StatusBar hidden={true} />
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
