import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Play, Pause, SkipForward, Heart } from 'lucide-react-native';
import { usePlayerStore } from '@/store/playerStore';
import { useLibraryStore } from '@/store/libraryStore';
import { BlurView } from 'expo-blur';
import ExpandedPlayer from './ExpandedPlayer';
import { AudioService } from '@/services/AudioService';

export default function MiniPlayer() {
  const [isExpanded, setIsExpanded] = useState(false);
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const setIsPlaying = usePlayerStore((state) => state.setIsPlaying);
  const playNext = usePlayerStore((state) => state.playNext);
  
  const savedTracks = useLibraryStore((state) => state.savedTracks) || [];
  const toggleSaveTrack = useLibraryStore((state) => state.toggleSaveTrack);

  const positionMs = usePlayerStore((state) => state.positionMs);
  const durationMs = usePlayerStore((state) => state.durationMs);

  if (!currentTrack) return null;

  const isLiked = savedTracks.some(t => t.videoId === currentTrack.videoId);

  const progressPercent = durationMs > 0 ? (positionMs / durationMs) * 100 : 0;

  return (
    <>
      <View style={styles.wrapper}>
        <BlurView intensity={95} tint="dark" style={styles.container}>
          <TouchableOpacity 
            style={styles.trackInfo} 
            activeOpacity={0.8}
            onPress={() => setIsExpanded(true)}
          >
            <Image source={{ uri: currentTrack.thumbnailUrl }} style={styles.thumbnail} />
            <View style={styles.textContainer}>
              <Text style={styles.title} numberOfLines={1}>{currentTrack.title}</Text>
              <Text style={styles.artist} numberOfLines={1}>{currentTrack.artist}</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.controls}>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => toggleSaveTrack(currentTrack)}
            >
              <Heart size={22} color={isLiked ? "#54F790" : "#fff"} fill={isLiked ? "#54F790" : "transparent"} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.iconButton}
              onPress={async () => {
                try {
                  if (isPlaying) {
                    await AudioService.pause();
                  } else {
                    await AudioService.resume();
                  }
                } catch (e) {
                  console.error(e);
                }
              }}
            >
              {isPlaying ? (
                <Pause size={24} color="#fff" fill="#fff" />
              ) : (
                <Play size={24} color="#fff" fill="#fff" style={{ marginLeft: 2 }} />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={playNext}
            >
              <SkipForward size={24} color="#fff" fill="#fff" />
            </TouchableOpacity>
          </View>

          {/* Thin Progress Bar at the bottom matching Vintify Web */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
        </BlurView>
      </View>

      <ExpandedPlayer 
        isVisible={isExpanded} 
        onClose={() => setIsExpanded(false)} 
      />
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 84, // Adjust to sit flush on top of the tab bar
    left: 0,
    right: 0,
    height: 64,
    borderRadius: 0, // Flush
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16, // Slightly more padding since it touches edges
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.04)', // Lighter for premium glassmorphism
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  trackInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: '#333',
  },
  textContainer: {
    marginLeft: 12,
    flex: 1,
  },
  title: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  artist: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    marginTop: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 2,
  },
  progressTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
  }
});
