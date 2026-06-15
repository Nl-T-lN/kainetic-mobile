import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { usePlayerStore } from '@/store/playerStore';
import { AudioService } from '@/services/AudioService';

export default function QueueTab() {
  const queue = usePlayerStore((state) => state.queue);
  const queueIndex = usePlayerStore((state) => state.queueIndex);
  const setQueue = usePlayerStore((state) => state.setQueue);

  if (!queue || queue.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Your queue is empty</Text>
      </View>
    );
  }

  const upcomingTracks = queue.slice(queueIndex + 1);

  const handlePlayTrack = (trackIndex: number) => {
    // trackIndex is relative to upcomingTracks, so we add queueIndex + 1 to get the absolute index
    const absoluteIndex = queueIndex + 1 + trackIndex;
    setQueue(queue, absoluteIndex);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Up Next</Text>
      
      {upcomingTracks.length === 0 ? (
        <Text style={styles.emptyText}>No upcoming tracks</Text>
      ) : (
        <FlatList
          data={upcomingTracks}
          keyExtractor={(item, index) => `${item.videoId}-${index}`}
          renderItem={({ item, index }) => (
            <TouchableOpacity 
              style={styles.trackItem}
              onPress={() => handlePlayTrack(index)}
            >
              <Image source={{ uri: item.thumbnailUrl }} style={styles.thumbnail} />
              <View style={styles.trackInfo}>
                <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.artist} numberOfLines={1}>{item.artist}</Text>
              </View>
            </TouchableOpacity>
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
    width: '100%',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#333',
  },
  trackInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  artist: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  }
});
