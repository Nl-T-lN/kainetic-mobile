import React, { useState, useRef, useEffect, memo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated, PanResponder, Dimensions, Platform } from 'react-native';
import { Play, Pause, SkipForward, Heart } from 'lucide-react-native';
import { usePlayerStore } from '@/store/playerStore';
import { useLibraryStore } from '@/store/libraryStore';
import ExpandedPlayer from './ExpandedPlayer';
import { AudioService } from '@/services/AudioService';
import { getColors } from 'react-native-image-colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 85 : 65;
const MINI_PLAYER_HEIGHT = 64;
const SNAP_TOP = 0;
const SNAP_BOTTOM = SCREEN_HEIGHT - TAB_BAR_HEIGHT - MINI_PLAYER_HEIGHT;

const MiniPlayerContent = memo(({ 
  track, 
  isPlaying, 
  progressPercent, 
  dominantColor, 
  isLiked, 
  onExpand, 
  onToggleLike, 
  onTogglePlay, 
  onNext 
}: { 
  track: any, 
  isPlaying: boolean, 
  progressPercent: number, 
  dominantColor: string | null, 
  isLiked: boolean, 
  onExpand: () => void, 
  onToggleLike: () => void, 
  onTogglePlay: () => void, 
  onNext: () => void 
}) => {
  return (
    <View style={[styles.miniPlayerWrapper, dominantColor ? { backgroundColor: dominantColor } : undefined]}>
      <View style={[styles.miniPlayerContainer, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
        <TouchableOpacity 
          style={styles.trackInfo} 
          activeOpacity={0.8}
          onPress={onExpand}
        >
          <Image source={{ uri: track.thumbnailUrl }} style={styles.thumbnail} />
          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={1}>{track.title}</Text>
            <Text style={styles.artist} numberOfLines={1}>{track.artist}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.controls}>
          <TouchableOpacity style={styles.iconButton} onPress={onToggleLike}>
            <Heart size={22} color={isLiked ? "#54F790" : "#fff"} fill={isLiked ? "#54F790" : "transparent"} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton} onPress={onTogglePlay}>
            {isPlaying ? (
              <Pause size={24} color="#fff" fill="#fff" />
            ) : (
              <Play size={24} color="#fff" fill="#fff" style={{ marginLeft: 2 }} />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.iconButton} onPress={onNext}>
            <SkipForward size={24} color="#fff" fill="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
        </View>
      </View>
    </View>
  );
});

export default function MiniPlayer() {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Use selective selectors to prevent unnecessary re-renders
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const playNext = usePlayerStore((state) => state.playNext);
  const positionMs = usePlayerStore((state) => state.positionMs);
  const durationMs = usePlayerStore((state) => state.durationMs);
  const dominantColor = usePlayerStore((state) => state.dominantColor);
  const setDominantColor = usePlayerStore((state) => state.setDominantColor);
  
  const savedTracks = useLibraryStore((state) => state.savedTracks);
  const toggleSaveTrack = useLibraryStore((state) => state.toggleSaveTrack);

  useEffect(() => {
    let isMounted = true;
    if (currentTrack?.thumbnailUrl) {
      getColors(currentTrack.thumbnailUrl, {
        fallback: '#1E1E1E',
        cache: true,
        key: currentTrack.thumbnailUrl,
      }).then((colors) => {
        if (!isMounted) return;
        const color = Platform.OS === 'android' ? (colors as any).dominant : (colors as any).primary;
        setDominantColor(color || '#1E1E1E');
      }).catch(err => {
        if (isMounted) setDominantColor('#1E1E1E');
      });
    }
    return () => { isMounted = false; };
  }, [currentTrack?.thumbnailUrl, setDominantColor]);

  const translateY = useRef(new Animated.Value(SNAP_BOTTOM)).current;

  const expandPlayer = useCallback(() => {
    setIsExpanded(true);
    Animated.spring(translateY, {
      toValue: SNAP_TOP,
      useNativeDriver: true,
      bounciness: 0,
      speed: 12,
    }).start();
  }, [translateY]);

  const collapsePlayer = useCallback(() => {
    setIsExpanded(false);
    Animated.spring(translateY, {
      toValue: SNAP_BOTTOM,
      useNativeDriver: true,
      bounciness: 0,
      speed: 12,
    }).start();
  }, [translateY]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 10,
      onPanResponderGrant: () => { translateY.extractOffset(); },
      onPanResponderMove: Animated.event([null, { dy: translateY }], { useNativeDriver: false }),
      onPanResponderRelease: (_, gestureState) => {
        translateY.flattenOffset();
        if (gestureState.vy < -0.5 || gestureState.dy < -SCREEN_HEIGHT / 5) expandPlayer();
        else if (gestureState.vy > 0.5 || gestureState.dy > SCREEN_HEIGHT / 5) collapsePlayer();
        else isExpanded ? expandPlayer() : collapsePlayer();
      }
    })
  ).current;

  if (!currentTrack) return null;

  const isLiked = savedTracks.some(t => t.videoId === currentTrack.videoId);
  const progressPercent = durationMs > 0 ? (positionMs / durationMs) * 100 : 0;

  const miniPlayerOpacity = translateY.interpolate({
    inputRange: [SNAP_TOP, SNAP_BOTTOM - 100, SNAP_BOTTOM],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp'
  });

  const expandedPlayerOpacity = translateY.interpolate({
    inputRange: [SNAP_TOP, SNAP_BOTTOM - 100, SNAP_BOTTOM],
    outputRange: [1, 1, 0],
    extrapolate: 'clamp'
  });

  return (
    <Animated.View style={[styles.sheetContainer, { transform: [{ translateY }] }]} pointerEvents="box-none">
      <Animated.View 
        style={[StyleSheet.absoluteFill, { opacity: expandedPlayerOpacity }]}
        pointerEvents={isExpanded ? 'auto' : 'none'}
      >
        <ExpandedPlayer isVisible={true} onClose={collapsePlayer} panHandlers={panResponder.panHandlers} />
      </Animated.View>

      <Animated.View 
        style={[styles.miniPlayerShadowContainer, { opacity: miniPlayerOpacity }]}
        pointerEvents={isExpanded ? 'none' : 'auto'}
        {...panResponder.panHandlers}
      >
        <MiniPlayerContent
          track={currentTrack}
          isPlaying={isPlaying}
          progressPercent={progressPercent}
          dominantColor={dominantColor}
          isLiked={isLiked}
          onExpand={expandPlayer}
          onToggleLike={() => toggleSaveTrack(currentTrack)}
          onTogglePlay={async () => isPlaying ? await AudioService.pause() : await AudioService.resume()}
          onNext={playNext}
        />
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
  miniPlayerShadowContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: MINI_PLAYER_HEIGHT,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  miniPlayerWrapper: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  miniPlayerContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
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
