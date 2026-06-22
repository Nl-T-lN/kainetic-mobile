import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight } from 'lucide-react-native';
import { BouncyButton } from '../ui/BouncyButton';
import { getResizedImage } from '@/utils/image';

interface SpeedDialCardProps {
  title: string;
  thumbnailUrl: string;
  isPlayable?: boolean;
  onPress: () => void;
  width?: number;
}

export function SpeedDialCard({ title, thumbnailUrl, isPlayable, onPress, width = 140 }: SpeedDialCardProps) {
  return (
    <BouncyButton onPress={onPress} style={[styles.container, { width, height: width }]} scaleValue={0.96}>
      <Image source={{ uri: getResizedImage(thumbnailUrl, 226) }} style={styles.image} contentFit="cover" transition={300} />
      
      {/* Dark gradient for text visibility */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.9)']}
        style={styles.gradient}
      />
      
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        
        {/* Navigation Chevron for non-song items */}
        {!isPlayable && (
          <ChevronRight size={16} color="#fff" style={styles.icon} />
        )}
      </View>
    </BouncyButton>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    marginRight: 4,
  },
  icon: {
    opacity: 0.8,
  }
});
