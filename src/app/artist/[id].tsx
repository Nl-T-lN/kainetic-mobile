import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Play } from 'lucide-react-native';
import { usePlayerStore } from '@/store/playerStore';
import { YouTubeBrowseService, ArtistResult } from '@/services/YouTubeBrowseService';
import { TrackList } from '@/components/features/TrackList';
import { PlaylistCard } from '@/components/features/PlaylistCard';
import { BlurView } from 'expo-blur';
import type { Track } from '@/types/music';

export default function ArtistView() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [data, setData] = useState<ArtistResult | null>(null);
  const [loading, setLoading] = useState(true);

  const setCurrentTrack = usePlayerStore((state) => state.setCurrentTrack);
  const setQueue = usePlayerStore((state) => state.setQueue);

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      try {
        const res = await YouTubeBrowseService.getArtist(id as string);
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const handlePlayTrack = async (track: Track, index: number) => {
    try {
      if (!data) return;
      setQueue(data.topTracks, index);
      setCurrentTrack(track);
    } catch (error) {
      console.error("Playback failed:", error);
    }
  };

  const handlePlayAll = () => {
      if (data && data.topTracks.length > 0) {
          handlePlayTrack(data.topTracks[0], 0);
      }
  }

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

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.headerBack} onPress={() => router.back()}>
        <ChevronLeft size={28} color="#fff" />
      </TouchableOpacity>
      
      <TrackList 
        tracks={data.topTracks}
        onTrackSelect={handlePlayTrack}
        hideThumbnails={false}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View>
            <View style={styles.heroSection}>
              <Image source={{ uri: data.thumbnailUrl }} style={[StyleSheet.absoluteFill, { opacity: 0.8 }]} blurRadius={50} />
              <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />

              <View style={styles.heroContent}>
                <Image source={{ uri: data.thumbnailUrl }} style={styles.heroImage} />
                <Text style={styles.title} numberOfLines={2}>{data.name}</Text>
                <Text style={styles.author}>{data.subscribers}</Text>
                
                <TouchableOpacity style={styles.playButton} onPress={handlePlayAll}>
                  <Play size={24} color="#000" fill="#000" />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionHeader}>Top Tracks</Text>
            </View>
          </View>
        }
        ListFooterComponent={
          <View>
            {data.albums.length > 0 && (
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionHeader}>Albums</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                        {data.albums.map((album, idx) => (
                            <PlaylistCard
                              key={idx}
                              id={album.id}
                              title={album.title}
                              subtitle={album.year}
                              thumbnailUrl={album.thumbnailUrl}
                              onPress={() => router.push(`/album/${album.id}`)}
                            />
                        ))}
                    </ScrollView>
                </View>
            )}

            {data.singles.length > 0 && (
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionHeader}>Singles</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                        {data.singles.map((single, idx) => (
                            <PlaylistCard
                              key={idx}
                              id={single.id}
                              title={single.title}
                              subtitle={single.year}
                              thumbnailUrl={single.thumbnailUrl}
                              onPress={() => router.push(`/album/${single.id}`)}
                            />
                        ))}
                    </ScrollView>
                </View>
            )}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
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
    width: 160,
    height: 160,
    borderRadius: 80,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -1,
  },
  author: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 15,
    fontWeight: '500',
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
  sectionContainer: {
    marginTop: 32,
  },
  sectionHeader: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    marginLeft: 16,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  trackList: {
    paddingHorizontal: 8,
  },
  horizontalScroll: {
    paddingHorizontal: 16,
    gap: 16,
  },
});
