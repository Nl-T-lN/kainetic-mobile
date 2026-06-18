import '../polyfill';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import MiniPlayer from '@/components/features/MiniPlayer';
import { AudioService } from '@/services/AudioService';
import { useEffect } from 'react';
import TrackPlayer from 'react-native-track-player';
import { PlaybackService } from '@/services/playbackService';

TrackPlayer.registerPlaybackService(() => PlaybackService);

export default function RootLayout() {
  useEffect(() => {
    AudioService.init();
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
      </Stack>
      {/* Global MiniPlayer overlaying the entire app (except when hidden by full player) */}
      <MiniPlayer />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
