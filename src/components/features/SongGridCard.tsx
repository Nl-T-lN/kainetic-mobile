import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { BouncyButton } from '../ui/BouncyButton';
import type { Track } from '@/types/music';

interface SongGridCardProps {
  track: Track;
  onPress: () => void;
  width?: number;
}

export function SongGridCard({ track, onPress, width = 160 }: SongGridCardProps) {
  const height = width; // 1:1 Aspect Ratio

  return (
    <BouncyButton onPress={onPress} style={[styles.container, { width }]} scaleValue={0.96}>
      <Image 
        source={{ uri: track.thumbnailUrl }} 
        style={[styles.image, { height }]} 
        resizeMode="cover"
      />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{track.title}</Text>
        <Text style={styles.artist} numberOfLines={1}>
          {track.artist || "Artist"}
        </Text>
      </View>
    </BouncyButton>
  );
}

const styles = StyleSheet.create({
  container: {
    marginRight: 16,
    marginBottom: 16,
  },
  image: {
    width: '100%',
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  info: {
    marginTop: 8,
  },
  title: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  artist: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  }
});
