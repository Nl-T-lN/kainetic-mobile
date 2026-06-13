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
      <View style={styles.cardInfo}>
        <Text style={styles.title} numberOfLines={1}>{track.title}</Text>
        <Text style={styles.artist} numberOfLines={1}>{track.artist}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 140,
    overflow: 'hidden',
  },
  cardImage: {
    width: 140,
    height: 140,
    borderRadius: 8,
    backgroundColor: '#222',
  },
  cardInfo: {
    paddingTop: 12,
  },
  title: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  artist: {
    color: '#aaa',
    fontSize: 13,
  }
});
