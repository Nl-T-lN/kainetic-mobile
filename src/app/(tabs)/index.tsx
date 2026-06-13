import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { usePlayerStore } from '@/store/playerStore';
import { AudioService } from '@/services/AudioService';
import type { Track } from '@/types/music';
import TopBar from '@/components/ui/TopBar';
import TrackCard from '@/components/features/TrackCard';
import TrackListItem from '@/components/features/TrackListItem';

const TRENDING_TRACKS: Track[] = [
  {
    videoId: 'dQw4w9WgXcQ',
    title: 'Never Gonna Give You Up',
    artist: 'Rick Astley',
    thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    durationMs: 212000,
  },
  {
    videoId: 'kJQP7kiw5Fk',
    title: 'Despacito',
    artist: 'Luis Fonsi',
    thumbnailUrl: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg',
    durationMs: 288000,
  },
  {
    videoId: 'fJ9rUzIMcZQ',
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    thumbnailUrl: 'https://i.ytimg.com/vi/fJ9rUzIMcZQ/hqdefault.jpg',
    durationMs: 359000,
  }
];

export default function HomeTab() {
  const setCurrentTrack = usePlayerStore((state) => state.setCurrentTrack);
  const setQueue = usePlayerStore((state) => state.setQueue);
  const [loadingTrackId, setLoadingTrackId] = useState<string | null>(null);

  const handlePlayTrack = async (track: Track, index: number) => {
    try {
      setLoadingTrackId(track.videoId);
      setQueue(TRENDING_TRACKS, index);
      setCurrentTrack(track);
      await AudioService.playTrack(track.videoId);
    } catch (error) {
      console.error("Playback failed:", error);
      alert("Failed to extract or play this track.");
    } finally {
      setLoadingTrackId(null);
    }
  };

  return (
    <View style={styles.container}>
      <TopBar />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionHeader}>Jam Again</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
        >
          {TRENDING_TRACKS.map((track, index) => (
            <TrackCard
              key={track.videoId}
              track={track}
              isLoading={loadingTrackId === track.videoId}
              onPress={() => handlePlayTrack(track, index)}
            />
          ))}
        </ScrollView>

        <Text style={styles.sectionHeader}>Recommendations</Text>
        <View style={styles.listContainer}>
          {[...TRENDING_TRACKS].reverse().map((track, index) => (
            <TrackListItem
              key={track.videoId + '-rec'}
              track={track}
              isLoading={loadingTrackId === track.videoId}
              onPress={() => handlePlayTrack(track, index)}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    paddingTop: 20,
    paddingBottom: 160, 
  },
  sectionHeader: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 16,
    marginBottom: 16,
    marginTop: 24,
    letterSpacing: -0.5,
  },
  horizontalScroll: {
    gap: 16,
    paddingLeft: 16,
    paddingRight: 32,
  },
  listContainer: {
    paddingHorizontal: 0,
  },
});
