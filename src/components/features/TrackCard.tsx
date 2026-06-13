import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Play } from 'lucide-react-native';
import type { Track } from '@/types/music';

interface TrackCardProps {
  track: Track;
  isLoading?: boolean;
  onPress: () => void;
  isArtist?: boolean;
}

export default function TrackCard({ track, isLoading, onPress, isArtist }: TrackCardProps) {
  return (
    <TouchableOpacity 
      style={[styles.card, isArtist && styles.cardArtist]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <Image source={{ uri: track.thumbnailUrl }} style={[styles.cardImage, isArtist && styles.cardImageArtist]} />
      <View style={[styles.cardInfo, isArtist && styles.cardInfoArtist]}>
        <Text style={[styles.title, isArtist && styles.titleArtist]} numberOfLines={1}>{track.title}</Text>
        {!isArtist && <Text style={styles.artist} numberOfLines={1}>{track.artist}</Text>}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 140,
    overflow: 'hidden',
  },
  cardArtist: {
    width: 110,
    alignItems: 'center',
  },
  cardImage: {
    width: 140,
    height: 140,
    borderRadius: 8,
    backgroundColor: '#222',
  },
  cardImageArtist: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  cardInfo: {
    paddingTop: 12,
  },
  cardInfoArtist: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  titleArtist: {
    textAlign: 'center',
  },
  artist: {
    color: '#aaa',
    fontSize: 13,
  }
});
