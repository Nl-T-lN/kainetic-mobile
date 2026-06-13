import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Play, MoreVertical } from 'lucide-react-native';
import type { Track } from '@/types/music';

interface TrackListItemProps {
  track: Track;
  isLoading?: boolean;
  onPress: () => void;
  index?: number;
}

export default function TrackListItem({ track, isLoading, onPress, index }: TrackListItemProps) {
  return (
    <TouchableOpacity 
      style={styles.container}
      activeOpacity={0.7}
      onPress={onPress}
    >
      {index !== undefined && (
        <Text style={styles.indexText}>{index + 1}</Text>
      )}
      
      <Image source={{ uri: track.thumbnailUrl }} style={styles.thumbnail} />
      
      <View style={styles.trackInfo}>
        <Text style={styles.title} numberOfLines={1}>{track.title}</Text>
        <Text style={styles.artist} numberOfLines={1}>{track.artist}</Text>
      </View>

      <View style={styles.actions}>
        {isLoading ? (
          <ActivityIndicator color="#1db954" size="small" />
        ) : (
          <TouchableOpacity style={styles.iconButton}>
            <MoreVertical size={20} color="#888" />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  indexText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
    width: 24,
    marginRight: 8,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#222',
  },
  trackInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 10,
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  artist: {
    color: '#aaa',
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
