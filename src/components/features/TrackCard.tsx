import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Play } from 'lucide-react-native';
import type { Track } from '@/types/music';

interface TrackCardProps {
  track: Track;
  isLoading?: boolean;
  onPress: () => void;
}

export default function TrackCard({ track, isLoading, onPress }: TrackCardProps) {
  return (
    <TouchableOpacity 
      style={styles.card}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <Image source={{ uri: track.thumbnailUrl }} style={styles.cardImage} />
      <View style={styles.cardOverlay}>
        <View style={styles.playButton}>
          {isLoading ? (
            <ActivityIndicator color="#000" size="small" />
          ) : (
            <Play size={24} color="#000" fill="#000" />
          )}
        </View>
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.title} numberOfLines={1}>{track.title}</Text>
        <Text style={styles.artist} numberOfLines={1}>{track.artist}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 200,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#222',
  },
  cardOverlay: {
    position: 'absolute',
    top: 140,
    right: 12,
  },
  cardInfo: {
    padding: 12,
    paddingTop: 16,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  artist: {
    color: '#aaa',
    fontSize: 14,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1db954',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  }
});
