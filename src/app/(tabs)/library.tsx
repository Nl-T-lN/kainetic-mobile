import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import TopBar from '@/components/ui/TopBar';
import { useLibraryStore } from '@/store/libraryStore';
import { Plus } from 'lucide-react-native';

export default function LibraryTab() {
  const playlists = useLibraryStore(state => state.playlists);

  return (
    <View style={styles.container}>
      <TopBar />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.sectionHeader}>Your Playlists</Text>
          <TouchableOpacity style={styles.addButton}>
            <Plus size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {playlists.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>You haven&apos;t created any playlists yet.</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {playlists.map(playlist => (
              <TouchableOpacity key={playlist.id} style={styles.playlistCard}>
                <View style={styles.playlistImageFallback}>
                  {playlist.coverUrl ? (
                    <Image source={{ uri: playlist.coverUrl }} style={styles.playlistImage} />
                  ) : (
                    <Text style={styles.fallbackIcon}>🎵</Text>
                  )}
                </View>
                <Text style={styles.playlistName} numberOfLines={1}>{playlist.name}</Text>
                <Text style={styles.playlistCount}>{playlist.tracks.length} tracks</Text>
              </TouchableOpacity>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionHeader: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 16,
  },
  playlistCard: {
    width: '47%',
    marginBottom: 8,
  },
  playlistImageFallback: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  playlistImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  fallbackIcon: {
    fontSize: 40,
    opacity: 0.5,
  },
  playlistName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  playlistCount: {
    color: '#888',
    fontSize: 13,
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
