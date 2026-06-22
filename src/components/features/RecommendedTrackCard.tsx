import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { MoreVertical } from 'lucide-react-native';
import type { Track } from '@/types/music';
import { getResizedImage } from '@/utils/image';

interface RecommendedTrackCardProps {
  track: Track;
  onPress: () => void;
  width?: number;
}

export function RecommendedTrackCard({ track, onPress, width = 320 }: RecommendedTrackCardProps) {
  return (
    <TouchableOpacity style={[styles.card, { width }]} onPress={onPress} activeOpacity={0.8}>
      <Image 
        source={{ uri: getResizedImage(track.thumbnailUrl, 226) }} 
        style={styles.image}
        contentFit="cover"
        transition={300}
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
    width: 320, // fixed width so chunks align well in horizontal scroll
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 8,
    marginRight: 16,
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
