import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MoreVertical } from 'lucide-react-native';
import type { Track } from '@/types/music';

interface RecommendedTrackCardProps {
  track: Track;
  onPress: () => void;
}

export function RecommendedTrackCard({ track, onPress }: RecommendedTrackCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <Image 
        source={{ uri: track.thumbnailUrl }} 
        style={styles.image} 
      />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{track.title}</Text>
        <Text style={styles.artist} numberOfLines={1}>
          {track.channelTitle || track.artist || "Artist"}
        </Text>
      </View>
      <View style={styles.meta}>
        <TouchableOpacity style={styles.moreButton}>
          <MoreVertical size={16} color="rgba(255,255,255,0.4)" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '85%', // 85vw from web styles
    minWidth: 280,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginRight: 16,
    marginBottom: 8,
  },
  image: {
    width: 56,
    height: 56,
    borderRadius: 6,
    marginRight: 12,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  artist: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moreButton: {
    padding: 8,
  }
});
