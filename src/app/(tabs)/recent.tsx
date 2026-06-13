import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import TopBar from '@/components/ui/TopBar';
import { useLibraryStore } from '@/store/libraryStore';
import TrackListItem from '@/components/features/TrackListItem';
import { usePlayerStore } from '@/store/playerStore';
import { AudioService } from '@/services/AudioService';

export default function RecentTab() {
  const recentTracks = useLibraryStore(state => state.recentTracks);
  const setCurrentTrack = usePlayerStore(state => state.setCurrentTrack);
  const setQueue = usePlayerStore(state => state.setQueue);

  const handlePlay = async (track: any, index: number) => {
    setQueue(recentTracks, index);
    setCurrentTrack(track);
    await AudioService.playTrack(track.videoId);
  };

  return (
    <View style={styles.container}>
      <TopBar />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionHeader}>Recently Played</Text>

        {recentTracks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Your listening history will appear here.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {recentTracks.map((track, index) => (
              <TrackListItem 
                key={track.videoId + '-' + index} 
                track={track}
                index={index}
                onPress={() => handlePlay(track, index)}
              />
            ))}
          </View>
        )}
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
    letterSpacing: -0.5,
  },
  list: {
    paddingBottom: 20,
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
