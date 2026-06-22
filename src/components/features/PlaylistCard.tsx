import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Play } from 'lucide-react-native';
import { getResizedImage } from '@/utils/image';

interface PlaylistCardProps {
  id?: string;
  title: string;
  subtitle?: string;
  thumbnailUrl: string;
  onPress: () => void;
  style?: any;
}

export function PlaylistCard({ title, subtitle, thumbnailUrl, onPress, style }: PlaylistCardProps) {
  return (
    <TouchableOpacity style={[styles.card, style]} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: getResizedImage(thumbnailUrl, 226) }} style={styles.image} contentFit="cover" transition={300} />
        {/* PlayOverlay can be shown by default or only on tap in mobile, let's keep it simple for now without hover states */}
      </View>
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      {subtitle && <Text style={styles.subtitle} numberOfLines={2}>{subtitle}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 140, // Match max-width 800px width from web
    flexDirection: 'column',
    gap: 8,
    marginRight: 16,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  title: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    lineHeight: 16,
  }
});
