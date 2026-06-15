import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, Dimensions, Platform, UIManager, LayoutAnimation, Animated, PanResponder } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronDown, Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, MoreVertical, MessageSquare, ListMusic } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { usePlayerStore } from '@/store/playerStore';
import { AudioService } from '@/services/AudioService';
import LyricsTab from './LyricsTab';
import QueueTab from './QueueTab';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');
const ARTWORK_SIZE = width - 64;

const formatTime = (ms: number) => {
  if (isNaN(ms) || ms < 0) return '0:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const CustomProgressBar = ({ positionMs, durationMs, onSeek }: { positionMs: number, durationMs: number, onSeek: (ms: number) => void }) => {
  const [sliderWidth, setSliderWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState(0);
  
  const dragStartParams = useRef({ startX: 0, startMs: 0 });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        setIsDragging(true);
        const x = evt.nativeEvent.locationX;
        if (sliderWidth > 0) {
           const p = Math.max(0, Math.min(1, x / sliderWidth));
           setDragValue(p * durationMs);
           dragStartParams.current = { startX: evt.nativeEvent.pageX, startMs: p * durationMs };
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        if (sliderWidth > 0) {
           const msDelta = (gestureState.dx / sliderWidth) * durationMs;
           const newMs = Math.max(0, Math.min(durationMs, dragStartParams.current.startMs + msDelta));
           setDragValue(newMs);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        setIsDragging(false);
        if (sliderWidth > 0) {
           const msDelta = (gestureState.dx / sliderWidth) * durationMs;
           const newMs = Math.max(0, Math.min(durationMs, dragStartParams.current.startMs + msDelta));
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
        onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
        {...panResponder.panHandlers}
      >
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${percent}%` }]} />
        </View>
        <View style={[styles.progressThumb, { left: `${percent}%` }]} />
      </View>
      <View style={styles.timeRow}>
        <Text style={styles.timeText}>{formatTime(currentMs)}</Text>
        <Text style={styles.timeText}>-{formatTime(durationMs - currentMs)}</Text>
      </View>
    </View>
  );
};

interface ExpandedPlayerProps {
  isVisible: boolean;
  onClose: () => void;
  panHandlers?: any;
}

export default function ExpandedPlayer({ isVisible, onClose, panHandlers }: ExpandedPlayerProps) {
  const [activeTab, setActiveTab] = useState<'LYRICS' | 'QUEUE' | null>(null);
  
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const playNext = usePlayerStore((state) => state.playNext);
  const playPrevious = usePlayerStore((state) => state.playPrevious);
  const positionMs = usePlayerStore((state) => state.positionMs);
  const durationMs = usePlayerStore((state) => state.durationMs);

  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const lastScrollY = useRef(0);

  const handleTabChange = (tab: 'LYRICS' | 'QUEUE' | null) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTab(tab);
    // Reset opacity instantly when changing views
    Animated.spring(controlsOpacity, { toValue: 1, useNativeDriver: true }).start();
  };

  const handleScroll = (event: any) => {
    const currentY = event.nativeEvent.contentOffset.y;
    
    if (currentY <= 0) {
       Animated.spring(controlsOpacity, { toValue: 1, useNativeDriver: true }).start();
    } else if (currentY > lastScrollY.current + 5) {
       Animated.spring(controlsOpacity, { toValue: 0, useNativeDriver: true }).start();
    } else if (currentY < lastScrollY.current - 5) {
       Animated.spring(controlsOpacity, { toValue: 1, useNativeDriver: true }).start();
    }
    lastScrollY.current = currentY;
  };

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

  const handleSeek = (ms: number) => {
    AudioService.seekTo(ms);
  };

  if (!currentTrack) return null;

  return (
    <View style={[styles.container, { display: isVisible ? 'flex' : 'none' }]}>
      {/* Background Artwork Blur */}
      <Image 
        source={{ uri: currentTrack.thumbnailUrl }} 
        style={styles.backgroundImage} 
        blurRadius={50} 
      />
      <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.safeArea}>
        {/* Header - Attach panHandlers here so user can drag down from the top */}
        <View style={styles.header} {...panHandlers}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <ChevronDown color="#fff" size={32} />
            </TouchableOpacity>
            {!activeTab && <Text style={styles.headerTitle}>Now Playing</Text>}
            <TouchableOpacity style={styles.moreButton}>
              <MoreVertical color="#fff" size={24} />
            </TouchableOpacity>
          </View>

          <View style={styles.mainContent}>
            
            {/* TOP AREA: Artwork + Title/Artist */}
            <View style={[styles.topArea, activeTab ? styles.topAreaRow : styles.topAreaColumn]}>
              <View style={activeTab ? styles.artworkSmallContainer : styles.artworkLargeContainer}>
                <Image
                  source={{ uri: currentTrack.thumbnailUrl }} 
                  style={[styles.artwork, activeTab && styles.artworkSmall]} 
                />
              </View>

              <View style={activeTab ? styles.trackDetailsSmall : styles.trackDetailsLarge}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.title, activeTab ? styles.titleSmall : styles.titleLarge]} numberOfLines={1}>{currentTrack.title}</Text>
                  <Text style={[styles.artist, activeTab ? styles.artistSmall : styles.artistLarge]} numberOfLines={1}>{currentTrack.artist}</Text>
                </View>
              </View>
            </View>

            {/* MIDDLE AREA: Tab Content */}
            {activeTab && (
              <View style={styles.tabContentArea}>
                {activeTab === 'LYRICS' && <LyricsTab onScroll={handleScroll} />}
                {activeTab === 'QUEUE' && <QueueTab onScroll={handleScroll} />}
              </View>
            )}

            {/* BOTTOM AREA: Animated Controls */}
            <Animated.View style={[styles.bottomArea, { opacity: controlsOpacity }]}>
              {/* Custom Progress Bar */}
              <CustomProgressBar positionMs={positionMs} durationMs={durationMs} onSeek={handleSeek} />

              {/* Main Controls */}
              <View style={styles.controls}>
                <TouchableOpacity style={styles.secondaryButton}>
                  <Shuffle color="rgba(255,255,255,0.5)" size={24} />
                </TouchableOpacity>

                <View style={styles.mainControlsCenter}>
                  <TouchableOpacity onPress={playPrevious} style={styles.controlButton}>
                    <SkipBack color="#fff" size={36} fill="#fff" />
                  </TouchableOpacity>

                  <TouchableOpacity onPress={togglePlayPause} style={styles.playButton}>
                    {isPlaying ? (
                      <Pause color="#000" size={36} fill="#000" />
                    ) : (
                      <Play color="#000" size={36} fill="#000" style={{ marginLeft: 4 }} />
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity onPress={playNext} style={styles.controlButton}>
                    <SkipForward color="#fff" size={36} fill="#fff" />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.secondaryButton}>
                  <Repeat color="rgba(255,255,255,0.5)" size={24} />
                </TouchableOpacity>
              </View>

              {/* Bottom Icon Row */}
              <View style={styles.bottomIconRow}>
                <TouchableOpacity onPress={() => handleTabChange(activeTab === 'LYRICS' ? null : 'LYRICS')}>
                  <MessageSquare size={24} color={activeTab === 'LYRICS' ? '#fff' : 'rgba(255,255,255,0.5)'} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleTabChange(activeTab === 'QUEUE' ? null : 'QUEUE')}>
                  <ListMusic size={24} color={activeTab === 'QUEUE' ? '#fff' : 'rgba(255,255,255,0.5)'} />
                </TouchableOpacity>
              </View>
            </Animated.View>

          </View>
        </SafeAreaView>
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    opacity: 0.5,
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
    paddingHorizontal: 32,
    paddingBottom: 20,
    justifyContent: 'flex-start',
  },
  topArea: {
    width: '100%',
  },
  topAreaColumn: {
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 32,
  },
  topAreaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 0,
    marginBottom: 16,
  },
  artworkLargeContainer: {
    width: ARTWORK_SIZE,
    height: ARTWORK_SIZE,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
  },
  artworkSmallContainer: {
    width: 60,
    height: 60,
    marginRight: 16,
  },
  artwork: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    backgroundColor: '#222',
  },
  artworkSmall: {
    borderRadius: 8,
  },
  trackDetailsLarge: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trackDetailsSmall: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: '#fff',
    marginBottom: 4,
  },
  titleLarge: {
    fontSize: 24,
    fontWeight: '800',
  },
  titleSmall: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  artist: {
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  artistLarge: {
    fontSize: 18,
  },
  artistSmall: {
    fontSize: 14,
  },
  tabContentArea: {
    flex: 1,
    backgroundColor: 'transparent',
    overflow: 'hidden',
    marginTop: 8,
  },
  bottomArea: {
    width: '100%',
    marginTop: 'auto',
  },
  progressBarPlaceholder: {
    width: '100%',
    marginBottom: 24,
  },
  progressTrackContainer: {
    width: '100%',
    height: 30, // hit area
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
    top: 9, // (30-12)/2
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
  bottomIconRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    marginTop: 8,
    paddingBottom: 8,
  }
});
