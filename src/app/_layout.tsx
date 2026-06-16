import '../polyfill';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
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
    <View style={styles.container}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
      </Stack>
      {/* Global MiniPlayer overlaying the entire app (except when hidden by full player) */}
      <MiniPlayer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
