import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, Platform, PanResponder, Modal, BackHandler } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  useAnimatedProps,
  withTiming, 
  withSpring,
  interpolate, 
  Extrapolation,
  runOnJS
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronDown, Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, MoreVertical, MessageSquare, ListMusic, Heart } from 'lucide-react-native';
import { usePlayerStore } from '@/store/playerStore';
import { useLibraryStore } from '@/store/libraryStore';
import { AudioService } from '@/services/AudioService';
import { getColors } from 'react-native-image-colors';
import LyricsTab from './LyricsTab';
import QueueTab from './QueueTab';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 85 : 65;
const MINI_PLAYER_HEIGHT = 64;
const BOTTOM_NAV_HEIGHT = TAB_BAR_HEIGHT;
const ARTWORK_SIZE = SCREEN_WIDTH - 64;

import { BouncyButton } from '../ui/BouncyButton';

const AnimatedImage = Animated.createAnimatedComponent(Image);

const clamp = Extrapolation.CLAMP;

const formatTime = (ms: number) => {
  if (isNaN(ms) || ms < 0) return '0:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const MiniProgressBar = () => {
  const positionMs = usePlayerStore((state) => state.positionMs);
  const durationMs = usePlayerStore((state) => state.durationMs);
  const progressPercent = durationMs > 0 ? (positionMs / durationMs) * 100 : 0;
  
  return (
    <View style={styles.progressTrackMini}>
      <View style={[styles.progressFillMini, { width: `${progressPercent}%` }]} />
    </View>
  );
};

const CustomProgressBar = ({ onSeek }: { onSeek: (ms: number) => void }) => {
  const positionMs = usePlayerStore((state) => state.positionMs);
  const durationMs = usePlayerStore((state) => state.durationMs);

  const [sliderWidthState, setSliderWidthState] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState(0);
  
  const sliderWidth = useRef(0);
  const durationRef = useRef(0);
  
  sliderWidth.current = sliderWidthState;
  durationRef.current = durationMs;
  
  const dragStartParams = useRef({ startX: 0, startMs: 0 });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        setIsDragging(true);
        const x = evt.nativeEvent.locationX;
        if (sliderWidth.current > 0) {
           const p = Math.max(0, Math.min(1, x / sliderWidth.current));
           setDragValue(p * durationRef.current);
           dragStartParams.current = { startX: evt.nativeEvent.pageX, startMs: p * durationRef.current };
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        if (sliderWidth.current > 0) {
           const msDelta = (gestureState.dx / sliderWidth.current) * durationRef.current;
           const newMs = Math.max(0, Math.min(durationRef.current, dragStartParams.current.startMs + msDelta));
           setDragValue(newMs);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        setIsDragging(false);
        if (sliderWidth.current > 0) {
           const msDelta = (gestureState.dx / sliderWidth.current) * durationRef.current;
           const newMs = Math.max(0, Math.min(durationRef.current, dragStartParams.current.startMs + msDelta));
           onSeek(newMs);
        }
      },
      onPanResponderTerminate: () => {
        setIsDragging(false);
      }
    })
  ).current;

  const currentMs = isDragging ? dragValue : positionMs;
  const percent = durationMs > 0 ? (currentMs / durationMs) * 100 : 0;

  return (
    <View style={styles.progressBarPlaceholder}>
      <View 
        style={styles.progressTrackContainer} 
        onLayout={(e) => setSliderWidthState(e.nativeEvent.layout.width)}
        {...panResponder.panHandlers}
      >
        <View style={styles.progressTrack} pointerEvents="none">
          <View style={[styles.progressFill, { width: `${percent}%` }]} />
        </View>
        <View style={[styles.progressThumb, { left: `${percent}%` }]} pointerEvents="none" />
      </View>
      <View style={styles.timeRow}>
        <Text style={styles.timeText}>{formatTime(currentMs)}</Text>
        <Text style={styles.timeText}>-{formatTime(durationMs - currentMs)}</Text>
      </View>
    </View>
  );
};

export default function PremiumPlayerLayout() {
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const playNext = usePlayerStore((state) => state.playNext);
  const playPrevious = usePlayerStore((state) => state.playPrevious);
  const dominantColor = usePlayerStore((state) => state.dominantColor) || '#1E1E1E';
  const setDominantColor = usePlayerStore((state) => state.setDominantColor);
  
  const insets = useSafeAreaInsets();
  
  const savedTracks = useLibraryStore((state) => state.savedTracks);
  const toggleSaveTrack = useLibraryStore((state) => state.toggleSaveTrack);

  const [activeTab, setActiveTab] = useState<'LYRICS' | 'QUEUE' | null>(null);

  // 0 = Mini Player snapped at bottom, 1 = Full Player full screen
  const playerProgress = useSharedValue(0);
  const playerContext = useSharedValue(0);
  
  // 0 = Queue Sheet hidden, 1 = Queue Sheet full screen
  const QUEUE_SNAP_TOP = insets.top + 10;
  const QUEUE_SNAP_PEEK = SCREEN_HEIGHT * 0.35; // 65% of screen height from top
  const QUEUE_SNAP_CLOSED = SCREEN_HEIGHT;

  const queueTranslateY = useSharedValue(SCREEN_HEIGHT);
  const queueSheetContext = useSharedValue(0);

  const closeQueueSheet = () => {
    queueTranslateY.value = withSpring(QUEUE_SNAP_CLOSED, { damping: 25, stiffness: 350, overshootClamping: true });
  };

  const openQueueSheet = () => {
    queueTranslateY.value = withSpring(QUEUE_SNAP_PEEK, { damping: 25, stiffness: 350, overshootClamping: true });
  };
  const tabSheetProgress = useSharedValue(0);
  const tabContext = useSharedValue(0);

  useEffect(() => {
    let isMounted = true;
    const currentUrl = currentTrack?.thumbnailUrl;
    if (currentUrl) {
      getColors(currentUrl, {
        fallback: '#1E1E1E',
        cache: true,
        key: currentUrl,
        quality: 'lowest',
      }).then((colors) => {
        if (!isMounted || usePlayerStore.getState().currentTrack?.thumbnailUrl !== currentUrl) return;
        const color = Platform.OS === 'android' ? (colors as any).dominant : (colors as any).primary;
        setDominantColor(color || '#1E1E1E');
      }).catch(err => {
        if (isMounted && usePlayerStore.getState().currentTrack?.thumbnailUrl === currentUrl) setDominantColor('#1E1E1E');
      });
    }
    return () => { isMounted = false; };
  }, [currentTrack?.thumbnailUrl, setDominantColor]);

  useEffect(() => {
    const onBackPress = () => {
      if (queueTranslateY.value < QUEUE_SNAP_CLOSED - 10) {
        closeQueueSheet();
        return true;
      }
      if (tabSheetProgress.value > 0.1) {
        closeTab();
        return true;
      }
      if (playerProgress.value > 0.1) {
        toggleFullPlayer();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backHandler.remove();
  }, []);

  const togglePlayPause = async () => {
    try {
      if (isPlaying) {
        await AudioService.pause();
      } else {
        await AudioService.resume();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // openQueueSheet moved above

  const handleSeek = (ms: number) => {
    usePlayerStore.getState().setPositionMs(ms);
    AudioService.seekTo(ms);
  };

  const openTab = (tab: 'LYRICS' | 'QUEUE') => {
    setActiveTab(tab);
    tabSheetProgress.value = withSpring(1, { damping: 25, stiffness: 350, overshootClamping: true });
  };

  const closeTab = () => {
    tabSheetProgress.value = withSpring(0, { damping: 25, stiffness: 350, overshootClamping: true });
    setTimeout(() => setActiveTab(null), 300);
  };

  const toggleFullPlayer = () => {
    if (playerProgress.value < 0.5) {
      playerProgress.value = withSpring(1, { damping: 25, stiffness: 350, overshootClamping: true });
    } else {
      playerProgress.value = withSpring(0, { damping: 25, stiffness: 350, overshootClamping: true });
      if (tabSheetProgress.value > 0) closeTab();
    }
  };

  // --- GESTURE 1: Dragging the Mini Player Up / Full Player Down ---
  const createPlayerGesture = () => Gesture.Pan()
    .activeOffsetY([-10, 10])
    .onStart(() => {
      playerContext.value = playerProgress.value;
    })
    .onUpdate((event) => {
      // Don't allow player drag if tab sheet is open
      if (tabSheetProgress.value > 0.1) return;

      const delta = -event.translationY / (SCREEN_HEIGHT - MINI_PLAYER_HEIGHT);
      playerProgress.value = Math.max(0, Math.min(1, playerContext.value + delta));
    })
    .onEnd((event) => {
      if (tabSheetProgress.value > 0.1) return;

      const isClosing = playerContext.value > 0.5;
      
      if (isClosing) {
        // Dragging down from Full Player
        if (event.velocityY > 300 || playerProgress.value < 0.85) {
          playerProgress.value = withSpring(0, { damping: 25, stiffness: 350, overshootClamping: true });
        } else {
          playerProgress.value = withSpring(1, { damping: 25, stiffness: 350, overshootClamping: true });
        }
      } else {
        // Dragging up from Mini Player
        if (event.velocityY < -300 || playerProgress.value > 0.15) {
          playerProgress.value = withSpring(1, { damping: 25, stiffness: 350, overshootClamping: true });
        } else {
          playerProgress.value = withSpring(0, { damping: 25, stiffness: 350, overshootClamping: true });
        }
      }
    });

  const miniPlayerGesture = createPlayerGesture();
  const fullPlayerGesture = createPlayerGesture();
  const artworkGesture = createPlayerGesture();
  const fullPlayerArtworkGesture = createPlayerGesture();

  // --- GESTURE 2: Tab Sheet Sliding ---
  const tabSheetGesture = Gesture.Pan()
    .onStart(() => {
      tabContext.value = tabSheetProgress.value;
    })
    .onUpdate((event) => {
      if (playerProgress.value < 1) return; // Only active if full player is open
      const delta = -event.translationY / (SCREEN_HEIGHT * 0.7);
      tabSheetProgress.value = Math.max(0, Math.min(1, tabContext.value + delta));
    })
    .onEnd((event) => {
      if (event.velocityY > 300 || tabSheetProgress.value < 0.8) {
        tabSheetProgress.value = withSpring(0, { damping: 25, stiffness: 350, overshootClamping: true });
        runOnJS(setActiveTab)(null); // Reset active tab when closed
      } else {
        tabSheetProgress.value = withSpring(1, { damping: 25, stiffness: 350, overshootClamping: true });
      }
    });

  // --- ANIMATED STYLES FOR TRANSITIONS ---
  
  // Controls the master container sliding up from screen bottom
  const masterContainerStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      playerProgress.value,
      [0, 1],
      [SCREEN_HEIGHT - MINI_PLAYER_HEIGHT - BOTTOM_NAV_HEIGHT, 0],
      clamp
    );
    return { transform: [{ translateY }] };
  });

  // Fades out mini player content gracefully without layout collapse
  const miniPlayerStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(playerProgress.value, [0, 0.2], [1, 0], clamp),
    };
  });

  const miniPlayerProps = useAnimatedProps(() => {
    return {
      pointerEvents: (playerProgress.value < 0.2 ? 'auto' : 'none') as any
    };
  });

  // Fades out Full Player sheet only at the very bottom
  const fullPlayerStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(playerProgress.value, [0, 0.2], [0, 1], clamp)
    };
  });

  const fullPlayerProps = useAnimatedProps(() => {
    return {
      pointerEvents: (playerProgress.value > 0.8 ? 'box-none' : 'none') as any
    };
  });

  // queueSheetProps removed since we use conditional rendering now

  const animatedArtworkStyle = useAnimatedStyle(() => {
    // Mini State Coordinates relative to masterContainer
    const miniSize = 44;
    const miniLeft = 16;
    const miniTop = 10;
    const miniRadius = 6;

    // Full State Coordinates relative to masterContainer
    const fullSize = SCREEN_WIDTH - 64;
    const fullLeft = 32;
    const fullTop = insets.top + 80;
    const fullRadius = 16;

    const size = interpolate(playerProgress.value, [0, 1], [miniSize, fullSize], clamp);
    const left = interpolate(playerProgress.value, [0, 1], [miniLeft, fullLeft], clamp);
    const top = interpolate(playerProgress.value, [0, 1], [miniTop, fullTop], clamp);
    const borderRadius = interpolate(playerProgress.value, [0, 1], [miniRadius, fullRadius], clamp);

    return {
      position: 'absolute',
      left,
      top,
      width: size,
      height: size,
      borderRadius,
      zIndex: 50,
    };
  });

  const queueSheetGesture = Gesture.Pan()
    .onStart(() => {
      queueSheetContext.value = queueTranslateY.value;
    })
    .onUpdate((event) => {
      const newY = queueSheetContext.value + event.translationY;
      queueTranslateY.value = Math.max(QUEUE_SNAP_TOP, newY);
    })
    .onEnd((event) => {
      const isFromPeek = queueSheetContext.value > QUEUE_SNAP_TOP + 10;
      if (isFromPeek) {
        if (event.velocityY > 300 || queueTranslateY.value > QUEUE_SNAP_PEEK + 60) {
          queueTranslateY.value = withSpring(QUEUE_SNAP_CLOSED, { damping: 25, stiffness: 350, overshootClamping: true });
        } else {
          queueTranslateY.value = withSpring(QUEUE_SNAP_PEEK, { damping: 25, stiffness: 350, overshootClamping: true });
        }
      } else {
        if (event.velocityY < -300 || queueTranslateY.value < QUEUE_SNAP_PEEK - 60) {
          queueTranslateY.value = withSpring(QUEUE_SNAP_TOP, { damping: 25, stiffness: 350, overshootClamping: true });
        } else {
          queueTranslateY.value = withSpring(QUEUE_SNAP_PEEK, { damping: 25, stiffness: 350, overshootClamping: true });
        }
      }
    });

  const queueSheetStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: queueTranslateY.value }],
    };
  });

  const artworkProps = useAnimatedProps(() => {
    return {
      pointerEvents: (playerProgress.value > 0.8 ? 'auto' : 'none') as any
    };
  });

  if (!currentTrack) return null;

  const isLiked = savedTracks.some(t => t.videoId === currentTrack.videoId);


  return (
    <Animated.View style={[styles.masterContainer, masterContainerStyle]} pointerEvents="box-none">
      
      {/* SECTION A: MINI PLAYER LAYER */}
      <GestureDetector gesture={miniPlayerGesture}>
        <Animated.View animatedProps={miniPlayerProps} style={[styles.miniPlayerRow, miniPlayerStyle]}>
          <View style={[styles.miniPlayerWrapper, { backgroundColor: dominantColor }]}>
            <View style={[styles.miniPlayerInner, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
              <BouncyButton 
                style={styles.trackInfo} 
                onPress={toggleFullPlayer}
                rippleRadius={200}
              >
                <View style={styles.thumbnailPlaceholder} />
                <View style={styles.textContainer}>
                  <Text style={styles.miniTitle} numberOfLines={1}>{currentTrack.title}</Text>
                  <Text style={styles.miniArtist} numberOfLines={1}>{currentTrack.artist}</Text>
                </View>
              </BouncyButton>

              <View style={styles.miniControls}>
                <BouncyButton style={styles.iconButton} onPress={() => toggleSaveTrack(currentTrack)}>
                  <Heart size={22} color={isLiked ? "#54F790" : "#fff"} fill={isLiked ? "#54F790" : "transparent"} />
                </BouncyButton>

                <BouncyButton style={styles.iconButton} onPress={togglePlayPause}>
                  {isPlaying ? (
                    <Pause color="#fff" size={24} fill="#fff" />
                  ) : (
                    <Play color="#fff" size={24} fill="#fff" />
                  )}
                </BouncyButton>
                
                <BouncyButton style={styles.iconButton} onPress={playNext}>
                  <SkipForward color="#fff" size={24} fill="#fff" />
                </BouncyButton>
              </View>

              <MiniProgressBar />
            </View>
          </View>
        </Animated.View>
      </GestureDetector>

      {/* SECTION B: FULL EXPANDED PLAYER */}
      <Animated.View animatedProps={fullPlayerProps} style={[styles.fullPlayerContent, fullPlayerStyle]}>
        <LinearGradient 
          colors={[dominantColor, '#121212', '#000000']} 
          locations={[0, 0.7, 1]}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView style={styles.safeArea} pointerEvents="box-none">
          <GestureDetector gesture={fullPlayerGesture}>
            <View style={styles.header}>
              <BouncyButton onPress={toggleFullPlayer} style={styles.closeButton} rippleRadius={32}>
                <ChevronDown color="#fff" size={32} />
              </BouncyButton>
              <Text style={styles.headerTitle}>Now Playing</Text>
              <BouncyButton style={styles.moreButton} rippleRadius={24}>
                <MoreVertical color="#fff" size={24} />
              </BouncyButton>
            </View>
          </GestureDetector>

          <View style={styles.mainContent} pointerEvents="box-none">
            {/* TOP AREA: Artwork + Title/Artist */}
            <GestureDetector gesture={fullPlayerArtworkGesture}>
              <View style={styles.topAreaColumn}>
                <View style={styles.artworkLargeContainer}>
                  <View style={styles.artworkPlaceholder} />
                </View>

                <View style={styles.trackDetailsLarge}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.titleLarge} numberOfLines={1}>{currentTrack.title}</Text>
                    <Text style={styles.artistLarge} numberOfLines={1}>{currentTrack.artist}</Text>
                  </View>
                </View>
              </View>
            </GestureDetector>

            {/* BOTTOM AREA: Animated Controls */}
            <View style={styles.bottomArea}>
              <CustomProgressBar onSeek={handleSeek} />

              <View style={styles.controls}>
                <BouncyButton style={styles.secondaryButton} rippleRadius={24}>
                  <Shuffle color="rgba(255,255,255,0.5)" size={24} />
                </BouncyButton>

                <View style={styles.mainControlsCenter}>
                  <BouncyButton onPress={playPrevious} style={styles.controlButton} rippleRadius={36}>
                    <SkipBack color="#fff" size={36} fill="#fff" />
                  </BouncyButton>

                  <BouncyButton onPress={togglePlayPause} style={styles.playButton} rippleRadius={48}>
                    {isPlaying ? (
                      <Pause color="#fff" size={36} fill="#fff" />
                    ) : (
                      <Play color="#fff" size={36} fill="#fff" style={{ marginLeft: 4 }} />
                    )}
                  </BouncyButton>

                  <BouncyButton onPress={playNext} style={styles.controlButton} rippleRadius={36}>
                    <SkipForward color="#fff" size={36} fill="#fff" />
                  </BouncyButton>
                </View>

                <BouncyButton style={styles.secondaryButton} rippleRadius={24}>
                  <Repeat color="rgba(255,255,255,0.5)" size={24} />
                </BouncyButton>
              </View>
            </View>

            {/* UP NEXT TAB BUTTON */}
            <BouncyButton style={styles.upNextTabButton} onPress={openQueueSheet} rippleRadius={28}>
              <Text style={styles.upNextTabText}>Up Next</Text>
            </BouncyButton>
          </View>
        </SafeAreaView>
      </Animated.View>

      {/* DEDICATED QUEUE SHEET (Cached persistently) */}
      <Animated.View style={[styles.queueSheetContainer, queueSheetStyle, { backgroundColor: dominantColor || '#111' }]}>
        <LinearGradient colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0.95)', '#000']} style={StyleSheet.absoluteFill} />
        <View style={{ flex: 1, paddingTop: 10 }}>
          <GestureDetector gesture={queueSheetGesture}>
                <View style={styles.queueSheetDragArea}>
                  <View style={styles.dragHandle} />
                </View>
              </GestureDetector>
          <QueueTab paddingBottom={QUEUE_SNAP_PEEK + 40} />
        </View>
      </Animated.View>

      {/* SHARED ELEMENT ARTWORK OVERLAY */}
      <GestureDetector gesture={artworkGesture}>
        <AnimatedImage 
          source={{ uri: currentTrack.thumbnailUrl }} 
          style={animatedArtworkStyle as any} 
          animatedProps={artworkProps as any}
          contentFit="cover"
          transition={300}
        />
      </GestureDetector>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  masterContainer: { 
    position: 'absolute', 
    left: 0, 
    right: 0, 
    bottom: 0, 
    height: SCREEN_HEIGHT, 
    backgroundColor: 'transparent',
    zIndex: 100,
  },
  miniPlayerRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    width: '100%',
    height: MINI_PLAYER_HEIGHT,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  miniPlayerWrapper: {
    flex: 1,
    height: '100%',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  miniPlayerInner: {
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
  thumbnailPlaceholder: {
    width: 44,
    height: 44,
    marginRight: 0,
  },
  textContainer: {
    marginLeft: 12,
    flex: 1,
  },
  miniTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  miniArtist: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    marginTop: 2,
  },
  miniControls: {
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
  progressTrackMini: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressFillMini: {
    height: '100%',
    backgroundColor: '#fff',
  },
  fullPlayerContent: { 
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT,
    zIndex: -1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    height: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  closeButton: {
    padding: 8,
    width: 48,
  },
  moreButton: {
    padding: 8,
    width: 48,
    alignItems: 'flex-end',
  },
  mainContent: {
    flex: 1,
  },
  topAreaColumn: {
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 32,
    backgroundColor: 'transparent',
  },
  artworkLargeContainer: {
    width: ARTWORK_SIZE,
    height: ARTWORK_SIZE,
    marginBottom: 32,
    backgroundColor: 'transparent',
  },
  artworkPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  trackDetailsLarge: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleLarge: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  artistLarge: {
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
    fontSize: 18,
  },
  bottomArea: {
    width: '100%',
    paddingHorizontal: 32,
  },
  progressBarPlaceholder: {
    width: '100%',
    marginBottom: 24,
  },
  progressTrackContainer: {
    width: '100%',
    height: 30, 
    justifyContent: 'center',
    marginBottom: -4,
  },
  progressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 3,
  },
  progressThumb: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
    top: 9,
    marginLeft: -6,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    fontVariant: ['tabular-nums'],
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  mainControlsCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },
  controlButton: {
    padding: 8,
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButton: {
    padding: 8,
  },
  upNextTabButton: {
    marginTop: 'auto',
    marginBottom: 40,
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  upNextTabText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  queueSheetContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT,
    backgroundColor: '#111',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    zIndex: 100,
  },
  queueSheetDragArea: {
    width: '100%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
  }
});
