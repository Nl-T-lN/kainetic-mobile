import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Play, Pause, SkipForward } from 'lucide-react-native';
import { usePlayerStore } from '@/store/playerStore';
import { BlurView } from 'expo-blur';

export default function MiniPlayer() {
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const setIsPlaying = usePlayerStore((state) => state.setIsPlaying);
  const playNext = usePlayerStore((state) => state.playNext);

  if (!currentTrack) return null;

  return (
    <View style={styles.wrapper}>
      <BlurView intensity={80} tint="dark" style={styles.container}>
        <TouchableOpacity style={styles.trackInfo} activeOpacity={0.8}>
          <Image source={{ uri: currentTrack.thumbnailUrl }} style={styles.thumbnail} />
          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={1}>{currentTrack.title}</Text>
            <Text style={styles.artist} numberOfLines={1}>{currentTrack.artist}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.controls}>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? (
              <Pause size={24} color="#fff" fill="#fff" />
            ) : (
              <Play size={24} color="#fff" fill="#fff" />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={playNext}
          >
            <SkipForward size={24} color="#fff" fill="#fff" />
          </TouchableOpacity>
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 85, // Above the tab bar
    left: 8,
    right: 8,
    height: 64,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  trackInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#333',
  },
  textContainer: {
    marginLeft: 12,
    flex: 1,
  },
  title: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  artist: {
    color: '#aaa',
    fontSize: 13,
    marginTop: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  }
});
