import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronDown, Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, MoreVertical } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { usePlayerStore } from '@/store/playerStore';
import { AudioService } from '@/services/AudioService';
import LyricsTab from './LyricsTab';
import QueueTab from './QueueTab';

const { width, height } = Dimensions.get('window');
const ARTWORK_SIZE = width - 64;

const formatTime = (ms: number) => {
  if (isNaN(ms) || ms < 0) return '0:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

interface ExpandedPlayerProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function ExpandedPlayer({ isVisible, onClose }: ExpandedPlayerProps) {
  const [activeTab, setActiveTab] = React.useState<'LYRICS' | 'QUEUE' | null>(null);
  
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const playNext = usePlayerStore((state) => state.playNext);
  const playPrevious = usePlayerStore((state) => state.playPrevious);
  const positionMs = usePlayerStore((state) => state.positionMs);
  const durationMs = usePlayerStore((state) => state.durationMs);

  if (!currentTrack) return null;

  const progressPercent = durationMs > 0 ? (positionMs / durationMs) * 100 : 0;

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

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Background Artwork Blur */}
        <Image 
          source={{ uri: currentTrack.thumbnailUrl }} 
          style={styles.backgroundImage} 
          blurRadius={50} 
        />
        <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />

        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <ChevronDown color="#fff" size={32} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Now Playing</Text>
            <TouchableOpacity style={styles.moreButton}>
              <MoreVertical color="#fff" size={24} />
            </TouchableOpacity>
          </View>

          <View style={styles.mainContent}>
            {/* Artwork */}
            <View style={styles.artworkContainer}>
              <Image
                source={{ uri: currentTrack.thumbnailUrl }} 
                style={[styles.artwork, activeTab && styles.artworkSmall]} 
              />
            </View>

            {/* Track Info */}
            <View style={styles.trackDetails}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title} numberOfLines={1}>{currentTrack.title}</Text>
                <Text style={styles.artist} numberOfLines={1}>{currentTrack.artist}</Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarPlaceholder}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
              </View>
              <View style={styles.timeRow}>
                <Text style={styles.timeText}>{formatTime(positionMs)}</Text>
                <Text style={styles.timeText}>{formatTime(durationMs)}</Text>
              </View>
            </View>

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

            {/* Tab Switcher below controls */}
            <View style={styles.bottomTabsContainer}>
              <View style={styles.tabSwitcher}>
                <TouchableOpacity 
                  style={[styles.tabButton, activeTab === 'LYRICS' && styles.activeTabButton]}
                  onPress={() => setActiveTab(activeTab === 'LYRICS' ? null : 'LYRICS')}
                >
                  <Text style={[styles.tabText, activeTab === 'LYRICS' && styles.activeTabText]}>Lyrics</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.tabButton, activeTab === 'QUEUE' && styles.activeTabButton]}
                  onPress={() => setActiveTab(activeTab === 'QUEUE' ? null : 'QUEUE')}
                >
                  <Text style={[styles.tabText, activeTab === 'QUEUE' && styles.activeTabText]}>Up Next</Text>
                </TouchableOpacity>
              </View>

              {/* Tab Content Area */}
              {activeTab && (
                <View style={styles.tabContentArea}>
                  {activeTab === 'LYRICS' && <LyricsTab />}
                  {activeTab === 'QUEUE' && <QueueTab />}
                </View>
              )}
            </View>

          </View>
        </SafeAreaView>
      </View>
    </Modal>
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
  artworkContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 32,
    flexShrink: 1, // allows it to shrink when tabs open
  },
  artwork: {
    width: ARTWORK_SIZE,
    height: ARTWORK_SIZE,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    backgroundColor: '#222',
  },
  artworkSmall: {
    width: ARTWORK_SIZE * 0.5,
    height: ARTWORK_SIZE * 0.5,
  },
  trackDetails: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  artist: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  progressBarPlaceholder: {
    width: '100%',
    marginBottom: 24,
  },
  progressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
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
    marginBottom: 24,
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
  bottomTabsContainer: {
    flex: 1,
    width: '100%',
  },
  tabSwitcher: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 16,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  activeTabButton: {
    backgroundColor: '#fff',
  },
  tabText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#000',
  },
  tabContentArea: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 16,
    overflow: 'hidden',
  }
});
