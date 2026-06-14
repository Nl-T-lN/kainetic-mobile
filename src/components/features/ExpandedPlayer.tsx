import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronDown, Play, Pause, SkipBack, SkipForward, Repeat, Shuffle } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { usePlayerStore } from '@/store/playerStore';

const { width } = Dimensions.get('window');
const ARTWORK_SIZE = width - 64; // 32px padding on each side

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
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const setIsPlaying = usePlayerStore((state) => state.setIsPlaying);
  const playNext = usePlayerStore((state) => state.playNext);
  const playPrevious = usePlayerStore((state) => state.playPrevious);
  const positionMs = usePlayerStore((state) => state.positionMs);
  const durationMs = usePlayerStore((state) => state.durationMs);

  if (!currentTrack) return null;

  const progressPercent = durationMs > 0 ? (positionMs / durationMs) * 100 : 0;

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
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <ChevronDown color="#fff" size={32} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Image
              source={{ uri: currentTrack.thumbnailUrl }} 
              style={styles.artwork} 
            />

            <View style={styles.trackDetails}>
              <Text style={styles.title} numberOfLines={2}>{currentTrack.title}</Text>
              <Text style={styles.artist} numberOfLines={1}>{currentTrack.artist}</Text>
            </View>

            <View style={styles.progressBarPlaceholder}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
              </View>
              <View style={styles.timeRow}>
                <Text style={styles.timeText}>{formatTime(positionMs)}</Text>
                <Text style={styles.timeText}>{formatTime(durationMs)}</Text>
              </View>
            </View>

            <View style={styles.controls}>
              <TouchableOpacity style={styles.secondaryButton}>
                <Shuffle color="rgba(255,255,255,0.5)" size={24} />
              </TouchableOpacity>

              <View style={styles.mainControls}>
                <TouchableOpacity onPress={playPrevious} style={styles.controlButton}>
                  <SkipBack color="#fff" size={36} fill="#fff" />
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => setIsPlaying(!isPlaying)} 
                  style={styles.playButton}
                >
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
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artwork: {
    width: ARTWORK_SIZE,
    height: ARTWORK_SIZE,
    borderRadius: 16,
    marginBottom: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 20,
    backgroundColor: '#222',
  },
  trackDetails: {
    width: '100%',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
  },
  artist: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  progressBarPlaceholder: {
    width: '100%',
    marginBottom: 32,
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
  },
  mainControls: {
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
});
