import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { BouncyButton } from '../ui/BouncyButton';

interface ArtistCardProps {
  id?: string;
  name: string;
  thumbnailUrl: string;
  onPress: () => void;
  style?: any;
}

export function ArtistCard({ name, thumbnailUrl, onPress, style }: ArtistCardProps) {
  return (
    <BouncyButton style={[styles.card, style]} onPress={onPress} scaleValue={0.94}>
      <Image source={{ uri: thumbnailUrl }} style={styles.image} />
      <Text style={styles.name} numberOfLines={2}>{name}</Text>
    </BouncyButton>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 120, 
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 16,
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 60, 
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  name: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    width: '100%',
  }
});
