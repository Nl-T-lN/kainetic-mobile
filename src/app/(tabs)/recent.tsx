import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import TopBar from '@/components/ui/TopBar';
import { useLibraryStore } from '@/store/libraryStore';
import { TrackList } from '@/components/features/TrackList';
import { usePlayerStore } from '@/store/playerStore';
import type { Track } from '@/types/music';

import ScreenWrapper from '@/components/ui/ScreenWrapper';

export default function RecentTab() {
  const recentTracks = useLibraryStore(state => state.recentTracks);
  const setCurrentTrack = usePlayerStore(state => state.setCurrentTrack);
  const setQueue = usePlayerStore(state => state.setQueue);

  const handlePlay = async (track: Track, index: number) => {
    setQueue(recentTracks, index);
    setCurrentTrack(track);
  };

  return (
    <ScreenWrapper style={styles.container}>
      <TopBar title="Recent" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionHeader}>Recently Played</Text>

        {recentTracks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Your listening history will appear here.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            <TrackList 
              tracks={recentTracks}
              onTrackSelect={handlePlay}
            />
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
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
    fontWeight: '800',
    marginLeft: 16,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  list: {
    paddingBottom: 20,
    paddingHorizontal: 8,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
    fontSize: 15,
  }
});
