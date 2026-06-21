import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import TopBar from '@/components/ui/TopBar';
import { useLibraryStore } from '@/store/libraryStore';
import { Plus, Heart, ListMusic } from 'lucide-react-native';
import ScreenWrapper from '@/components/ui/ScreenWrapper';
import TrackList from '@/components/features/TrackList';
import { usePlayerStore } from '@/store/playerStore';

export default function LibraryTab() {
  const playlists = useLibraryStore(state => state.playlists);
  const savedTracks = useLibraryStore(state => state.savedTracks) || [];
  const createPlaylist = useLibraryStore(state => state.createPlaylist);

  const setCurrentTrack = usePlayerStore(state => state.setCurrentTrack);
  const setQueue = usePlayerStore(state => state.setQueue);

  const handleCreatePlaylist = () => {
    Alert.prompt(
      "New Playlist",
      "Enter a name for your playlist",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Create",
          onPress: (name) => {
            if (name && name.trim().length > 0) {
              createPlaylist(name.trim());
            }
          }
        }
      ],
      "plain-text"
    );
  };

  const handlePlayLikedSong = (track: any) => {
    setCurrentTrack(track);
    setQueue(savedTracks);
  };

  return (
    <ScreenWrapper style={styles.container}>
      <TopBar title="Library" />
      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Playlists Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.headerRow}>
            <ListMusic size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.sectionHeader}>Your Playlists</Text>
          </View>

          <View style={styles.grid}>
            {/* New Playlist Card */}
            <TouchableOpacity style={styles.newPlaylistCard} onPress={handleCreatePlaylist}>
              <View style={styles.newPlaylistIcon}>
                <Plus size={24} color="#888" />
              </View>
              <Text style={styles.playlistName}>New Playlist</Text>
            </TouchableOpacity>

            {/* User Playlists */}
            {playlists.map(playlist => (
              <TouchableOpacity key={playlist.id} style={styles.playlistCard}>
                <View style={styles.playlistImageFallback}>
                  {playlist.coverUrl ? (
                    <Image source={{ uri: playlist.coverUrl }} style={styles.playlistImage} />
                  ) : (
                    <ListMusic size={32} color="rgba(255,255,255,0.2)" />
                  )}
                </View>
                <Text style={styles.playlistName} numberOfLines={1}>{playlist.name}</Text>
                <Text style={styles.playlistCount}>{playlist.tracks.length} {playlist.tracks.length === 1 ? 'track' : 'tracks'}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Liked Songs Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.headerRow}>
            <Heart size={20} color="#ff6b6b" fill="rgba(255, 107, 107, 0.2)" style={{ marginRight: 8 }} />
            <Text style={styles.sectionHeader}>Liked Songs</Text>
          </View>

          {savedTracks.length > 0 ? (
            <TrackList 
              tracks={savedTracks} 
              onTrackSelect={handlePlayLikedSong}
            />
          ) : (
            <View style={styles.emptyState}>
              <Heart size={40} color="#888" style={{ marginBottom: 16, opacity: 0.5 }} />
              <Text style={styles.emptyHeader}>No liked songs yet</Text>
              <Text style={styles.emptyText}>Tap the heart icon on any track to add it to your liked songs.</Text>
            </View>
          )}
        </View>

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
  sectionContainer: {
    marginBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionHeader: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
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
  newPlaylistCard: {
    width: '47%',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderStyle: 'dashed',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    aspectRatio: 0.85,
  },
  newPlaylistIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
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
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderStyle: 'dashed',
  },
  emptyHeader: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  }
});
