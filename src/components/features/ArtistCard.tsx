import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';

interface ArtistCardProps {
  id?: string;
  name: string;
  thumbnailUrl: string;
  onPress: () => void;
}

export function ArtistCard({ name, thumbnailUrl, onPress }: ArtistCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <Image source={{ uri: thumbnailUrl }} style={styles.image} />
      <Text style={styles.name} numberOfLines={1}>{name}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 110, // Match max-width 800px width from web
    alignItems: 'center',
    marginRight: 16,
  },
  image: {
    width: 110,
    height: 110,
    borderRadius: 55, // 50% for circle
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  name: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    width: '100%',
  }
});
