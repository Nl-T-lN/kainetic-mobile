import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ChevronLeft, Play } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { TrackList } from '@/components/features/TrackList';
import type { Track } from '@/types/music';
import type { BrowseResult } from '@/services/YouTubeBrowseService';

interface CollectionDetailViewProps {
  data: BrowseResult | null;
  loading: boolean;
  type: 'Album' | 'Playlist';
  onPlayTrack: (track: Track, index: number) => void;
}

export default function CollectionDetailView({ data, loading, type, onPlayTrack }: CollectionDetailViewProps) {
  const router = useRouter();

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#34d399" />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Failed to load content.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
           <Text style={styles.backText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const totalDurationMs = data.tracks.reduce((acc, curr) => acc + (curr.durationMs || 0), 0);
  const durationMins = Math.floor(totalDurationMs / 60000);

  const HeroSection = () => (
    <View style={styles.heroSection}>
      <Image source={{ uri: data.thumbnailUrl }} style={[StyleSheet.absoluteFill, { opacity: 0.8 }]} blurRadius={50} />
      <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
      
      <View style={styles.heroContent}>
        <Image source={{ uri: data.thumbnailUrl }} style={styles.heroImage} />
        <Text style={styles.title} numberOfLines={2}>{data.title}</Text>
        <Text style={styles.author}>{type} • {data.author}</Text>
        <Text style={styles.stats}>{data.tracks.length} songs • {durationMins} minutes</Text>
        
        <TouchableOpacity 
          style={styles.playButton} 
          onPress={() => onPlayTrack(data.tracks[0], 0)}
          disabled={data.tracks.length === 0}
        >
          <Play size={24} color="#000" fill="#000" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.headerBack} onPress={() => router.back()}>
        <ChevronLeft size={28} color="#fff" />
      </TouchableOpacity>
      
      <TrackList 
        tracks={data.tracks}
        onTrackSelect={onPlayTrack}
        ListHeaderComponent={<HeroSection />}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  listContent: {
    paddingBottom: 160,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 16,
  },
  backButton: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderRadius: 20,
  },
  backText: {
      color: '#fff',
      fontWeight: '600'
  },
  headerBack: {
    position: 'absolute',
    top: 50,
    left: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroSection: {
    position: 'relative',
    overflow: 'hidden',
  },
  heroContent: {
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 20,
    paddingBottom: 32,
    zIndex: 1,
  },
  heroImage: {
    width: 240,
    height: 240,
    borderRadius: 8,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  author: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  stats: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    marginBottom: 24,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
