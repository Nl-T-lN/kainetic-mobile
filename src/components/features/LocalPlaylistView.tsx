import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, ActivityIndicator, Alert, Keyboard } from 'react-native';
import { Image } from 'expo-image';
import { ChevronLeft, Play, Search, Plus, Trash2, ListMusic, Sparkles } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { TrackList } from '@/components/features/TrackList';
import type { Track, SearchResult } from '@/types/music';
import { getResizedImage } from '@/utils/image';
import { useLibraryStore, Playlist } from '@/store/libraryStore';
import { YouTubeSearchService } from '@/services/YouTubeSearchService';

interface LocalPlaylistViewProps {
  playlist: Playlist;
  onPlayTrack: (track: Track, index: number) => void;
}

export default function LocalPlaylistView({ playlist, onPlayTrack }: LocalPlaylistViewProps) {
  const router = useRouter();
  const deletePlaylist = useLibraryStore(state => state.deletePlaylist);
  const removeTrackFromPlaylist = useLibraryStore(state => state.removeTrackFromPlaylist);
  const addTrackToPlaylist = useLibraryStore(state => state.addTrackToPlaylist);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  const handleDeletePlaylist = () => {
    Alert.alert(
      "Delete Playlist",
      "Are you sure you want to delete this playlist?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => {
            deletePlaylist(playlist.id);
            router.back();
          }
        }
      ]
    );
  };

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    Keyboard.dismiss();
    try {
      const results = await YouTubeSearchService.search(query, 'song');
      setSearchResults(results.filter(r => r.type === 'song'));
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleAddTrack = (track: Track) => {
    if (!playlist.tracks.some(t => t.videoId === track.videoId)) {
      addTrackToPlaylist(playlist.id, track);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const totalDurationMs = playlist.tracks.reduce((acc, curr) => acc + (curr.durationMs || 0), 0);
  const durationMins = Math.floor(totalDurationMs / 60000);

  const HeroSection = () => (
    <View style={styles.heroSection}>
      {playlist.coverUrl ? (
        <Image source={{ uri: getResizedImage(playlist.coverUrl, 800) }} style={[StyleSheet.absoluteFill, { opacity: 0.8 }]} blurRadius={50} contentFit="cover" />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#1E1E1E', opacity: 0.8 }]} />
      )}
      <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
      
      <View style={styles.heroContent}>
        {playlist.coverUrl ? (
          <Image source={{ uri: getResizedImage(playlist.coverUrl, 480) }} style={styles.heroImage} contentFit="cover" />
        ) : (
          <View style={[styles.heroImage, { backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' }]}>
            <ListMusic size={64} color="rgba(255,255,255,0.2)" />
          </View>
        )}
        <Text style={styles.title} numberOfLines={2}>{playlist.name}</Text>
        <Text style={styles.author}>Playlist • {new Date(playlist.createdAt).toLocaleDateString()}</Text>
        <Text style={styles.stats}>{playlist.tracks.length} songs • {durationMins} minutes</Text>
        
        <View style={styles.heroActions}>
          <TouchableOpacity 
            style={[styles.playButton, playlist.tracks.length === 0 && { opacity: 0.5 }]} 
            onPress={() => onPlayTrack(playlist.tracks[0], 0)}
            disabled={playlist.tracks.length === 0}
          >
            <Play size={24} color="#000" fill="#000" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDeletePlaylist}>
            <Trash2 size={20} color="#ff6b6b" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const SearchSection = () => (
    <View style={styles.searchSection}>
      <Text style={styles.searchSectionTitle}>
        <Search size={18} color="#fff" /> Let's find something for your playlist
      </Text>
      
      <View style={styles.searchBarContainer}>
        <Search color="#888" size={20} />
        <TextInput 
          style={styles.searchInput}
          placeholder="Search for songs"
          placeholderTextColor="#888"
          returnKeyType="search"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={() => handleSearch(searchQuery)}
        />
      </View>

      {isSearching ? (
        <ActivityIndicator size="small" color="#34d399" style={{ marginTop: 20 }} />
      ) : searchResults.length > 0 ? (
        <View style={styles.searchResults}>
          {searchResults.map((res, idx) => {
            const track: Track = {
              videoId: res.videoId || '',
              title: res.title,
              artist: res.channelTitle || 'Unknown Artist',
              thumbnailUrl: res.thumbnailUrl,
              durationMs: res.durationMs || 0
            };
            const isAdded = playlist.tracks.some(t => t.videoId === track.videoId);
            return (
              <View key={`${track.videoId}-${idx}`} style={styles.searchResultItem}>
                <Image source={{ uri: getResizedImage(track.thumbnailUrl, 100) }} style={styles.searchResultThumb} contentFit="cover" />
                <View style={styles.searchResultInfo}>
                  <Text style={styles.searchResultTitle} numberOfLines={1}>{track.title}</Text>
                  <Text style={styles.searchResultArtist} numberOfLines={1}>{track.artist}</Text>
                </View>
                <TouchableOpacity 
                  style={[styles.addTrackBtn, isAdded && styles.addTrackBtnDisabled]} 
                  onPress={() => handleAddTrack(track)}
                  disabled={isAdded}
                >
                  <Plus size={20} color={isAdded ? "rgba(255,255,255,0.3)" : "#fff"} />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      ) : playlist.tracks.length === 0 ? (
        <View style={styles.emptyState}>
          <ListMusic size={40} color="rgba(255,255,255,0.2)" style={{ marginBottom: 16 }} />
          <Text style={styles.emptyHeader}>It's a bit empty here...</Text>
          <Text style={styles.emptyText}>Search for songs above to add them to your playlist.</Text>
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.headerBack} onPress={() => router.back()}>
        <ChevronLeft size={28} color="#fff" />
      </TouchableOpacity>
      
      <FlatList
        data={playlist.tracks}
        keyExtractor={(item, index) => `${item.videoId}-${index}`}
        ListHeaderComponent={<HeroSection />}
        ListFooterComponent={<SearchSection />}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => (
          <TouchableOpacity 
            style={styles.trackRow}
            onPress={() => onPlayTrack(item, index)}
          >
            <Image source={{ uri: getResizedImage(item.thumbnailUrl, 100) }} style={styles.trackThumb} contentFit="cover" />
            <View style={styles.trackInfo}>
              <Text style={styles.trackTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.trackArtist} numberOfLines={1}>{item.artist}</Text>
            </View>
            <TouchableOpacity 
              style={styles.removeTrackBtn} 
              onPress={() => removeTrackFromPlaylist(playlist.id, item.videoId)}
            >
              <Trash2 size={18} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
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
  headerBack: {
    position: 'absolute',
    top: 48,
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
    width: '100%',
    paddingTop: 100,
    paddingBottom: 32,
    alignItems: 'center',
  },
  heroContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    width: '100%',
  },
  heroImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  author: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  stats: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    marginBottom: 24,
  },
  heroActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#34d399',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  searchSection: {
    marginTop: 32,
    paddingHorizontal: 16,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  searchSectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 8,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    marginLeft: 12,
  },
  searchResults: {
    marginTop: 8,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  searchResultThumb: {
    width: 48,
    height: 48,
    borderRadius: 6,
  },
  searchResultInfo: {
    flex: 1,
    marginLeft: 12,
  },
  searchResultTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  searchResultArtist: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
  addTrackBtn: {
    padding: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  addTrackBtnDisabled: {
    backgroundColor: 'transparent',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyHeader: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    textAlign: 'center',
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  trackThumb: {
    width: 48,
    height: 48,
    borderRadius: 6,
  },
  trackInfo: {
    flex: 1,
    marginLeft: 12,
  },
  trackTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  trackArtist: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
  removeTrackBtn: {
    padding: 12,
  }
});
