import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated, PanResponder, Dimensions, Platform } from 'react-native';
import { Play, Pause, SkipForward, Heart } from 'lucide-react-native';
import { usePlayerStore } from '@/store/playerStore';
import { useLibraryStore } from '@/store/libraryStore';
import { BlurView } from 'expo-blur';
import ExpandedPlayer from './ExpandedPlayer';
import { AudioService } from '@/services/AudioService';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
// Android tab bar is ~65, iOS is ~85
const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 85 : 65;
const MINI_PLAYER_HEIGHT = 64;

// The Y translation when the player is fully expanded (top of screen)
const SNAP_TOP = 0;
// The Y translation when the player is minimized. 
// We want the MiniPlayer to sit exactly on top of the tab bar.
// Since the sheet is SCREEN_HEIGHT tall, translating it down by this amount 
// makes the top of the sheet sit exactly above the tab bar.
const SNAP_BOTTOM = SCREEN_HEIGHT - TAB_BAR_HEIGHT - MINI_PLAYER_HEIGHT;

export default function MiniPlayer() {
  const [isExpanded, setIsExpanded] = useState(false);
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const playNext = usePlayerStore((state) => state.playNext);
  
  const savedTracks = useLibraryStore((state) => state.savedTracks) || [];
  const toggleSaveTrack = useLibraryStore((state) => state.toggleSaveTrack);

  const positionMs = usePlayerStore((state) => state.positionMs);
  const durationMs = usePlayerStore((state) => state.durationMs);

  const translateY = useRef(new Animated.Value(SNAP_BOTTOM)).current;

  const expandPlayer = () => {
    setIsExpanded(true);
    Animated.spring(translateY, {
      toValue: SNAP_TOP,
      useNativeDriver: true,
      bounciness: 0, // Apple Music doesn't bounce much on the sheet
      speed: 12,
    }).start();
  };

  const collapsePlayer = () => {
    setIsExpanded(false);
    Animated.spring(translateY, {
      toValue: SNAP_BOTTOM,
      useNativeDriver: true,
      bounciness: 0,
      speed: 12,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      // Only capture drag if we dragged a bit vertically so we don't block taps
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderGrant: () => {
        translateY.extractOffset(); // Allow seamless continuation from current translation
      },
      onPanResponderMove: Animated.event(
        [null, { dy: translateY }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, gestureState) => {
        translateY.flattenOffset();
        
        // If we dragged up fast, or dragged past a quarter of the screen upwards
        if (gestureState.vy < -0.5 || gestureState.dy < -SCREEN_HEIGHT / 5) {
          expandPlayer();
        } 
        // If we dragged down fast, or dragged past a quarter of the screen downwards
        else if (gestureState.vy > 0.5 || gestureState.dy > SCREEN_HEIGHT / 5) {
          collapsePlayer();
        } 
        // Snap back to nearest state
        else {
          if (isExpanded) {
            expandPlayer();
          } else {
            collapsePlayer();
          }
        }
      }
    })
  ).current;

  if (!currentTrack) return null;

  const isLiked = savedTracks.some(t => t.videoId === currentTrack.videoId);
  const progressPercent = durationMs > 0 ? (positionMs / durationMs) * 100 : 0;

  // Fade out MiniPlayer as it goes up
  const miniPlayerOpacity = translateY.interpolate({
    inputRange: [SNAP_TOP, SNAP_BOTTOM - 100, SNAP_BOTTOM],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp'
  });

  // Fade in ExpandedPlayer as it goes up
  const expandedPlayerOpacity = translateY.interpolate({
    inputRange: [SNAP_TOP, SNAP_BOTTOM - 100, SNAP_BOTTOM],
    outputRange: [1, 1, 0],
    extrapolate: 'clamp'
  });

  // Prevent ExpandedPlayer from blocking touches when minimized
  const pointerEvents = isExpanded ? 'auto' : 'none';

  return (
    <Animated.View 
      style={[
        styles.sheetContainer, 
        { transform: [{ translateY }] }
      ]}
      pointerEvents="box-none"
    >
      {/* Expanded Player rendered behind Mini Player */}
      <Animated.View 
        style={[StyleSheet.absoluteFill, { opacity: expandedPlayerOpacity }]}
        pointerEvents={pointerEvents}
      >
        <ExpandedPlayer 
          isVisible={true} 
          onClose={collapsePlayer} 
          panHandlers={panResponder.panHandlers}
        />
      </Animated.View>

      {/* Mini Player */}
      <Animated.View 
        style={[styles.miniPlayerWrapper, { opacity: miniPlayerOpacity }]}
        pointerEvents={isExpanded ? 'none' : 'auto'}
        {...panResponder.panHandlers}
      >
        <BlurView intensity={95} tint="dark" style={styles.miniPlayerContainer}>
          <TouchableOpacity 
            style={styles.trackInfo} 
            activeOpacity={0.8}
            onPress={expandPlayer}
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
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheetContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT,
    backgroundColor: 'transparent',
  },
  miniPlayerWrapper: {
    position: 'absolute',
    top: 0, // Sits at the top of the sheet
    left: 0,
    right: 0,
    height: MINI_PLAYER_HEIGHT,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  miniPlayerContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.04)', 
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
