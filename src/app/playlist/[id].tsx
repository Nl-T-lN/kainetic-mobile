import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Play } from 'lucide-react-native';
import { usePlayerStore } from '@/store/playerStore';
import { AudioService } from '@/services/AudioService';
import { YouTubeBrowseService, BrowseResult } from '@/services/YouTubeBrowseService';
import TrackListItem from '@/components/features/TrackListItem';

export default function PlaylistView() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [data, setData] = useState<BrowseResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingTrackId, setLoadingTrackId] = useState<string | null>(null);

  const setCurrentTrack = usePlayerStore((state) => state.setCurrentTrack);
  const setQueue = usePlayerStore((state) => state.setQueue);

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      try {
        const res = await YouTubeBrowseService.getAlbumOrPlaylist(id as string);
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const handlePlayTrack = async (track: any, index: number) => {
    try {
      if (!data) return;
      setLoadingTrackId(track.videoId);
      setQueue(data.tracks, index);
      setCurrentTrack(track);
      await AudioService.playTrack(track.videoId);
    } catch (error) {
      console.error("Playback failed:", error);
      alert("Failed to play this track.");
    } finally {
      setLoadingTrackId(null);
    }
  };

  const handlePlayAll = () => {
      if (data && data.tracks.length > 0) {
          handlePlayTrack(data.tracks[0], 0);
      }
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#fff" />
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.headerBack} onPress={() => router.back()}>
        <ChevronLeft size={28} color="#fff" />
      </TouchableOpacity>
      
      <View style={styles.heroSection}>
        <Image source={{ uri: data.thumbnailUrl }} style={styles.heroImage} />
        <Text style={styles.title} numberOfLines={2}>{data.title}</Text>
        <Text style={styles.author}>{data.author}</Text>
        
        <TouchableOpacity style={styles.playButton} onPress={handlePlayAll}>
          <Play size={24} color="#000" fill="#000" />
          <Text style={styles.playButtonText}>Play</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.trackList}>
        {data.tracks.map((track, index) => (
          <TrackListItem
            key={track.videoId + '-' + index}
            track={track}
            isLoading={loadingTrackId === track.videoId}
            onPress={() => handlePlayTrack(track, index)}
          />
        ))}
      </View>
    </ScrollView>
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
      backgroundColor: '#333',
      borderRadius: 8,
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
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 20,
    paddingBottom: 32,
    backgroundColor: 'transparent',
  },
  heroImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  author: {
    color: '#aaa',
    fontSize: 16,
    marginBottom: 24,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1db954',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  playButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  trackList: {
    paddingHorizontal: 16,
  },
});
