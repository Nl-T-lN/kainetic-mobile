import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Search, Clock, X } from 'lucide-react-native';
import TopBar from '@/components/ui/TopBar';
import TrackCard from '@/components/features/TrackCard';
import TrackListItem from '@/components/features/TrackListItem';
import { YouTubeSearchService } from '@/services/YouTubeSearchService';
import { usePlayerStore } from '@/store/playerStore';
import { AudioService } from '@/services/AudioService';
import type { SearchResult, Track } from '@/types/music';

type FilterType = 'song' | 'album' | 'artist' | 'playlist';
const FILTERS: { label: string; value: FilterType }[] = [
  { label: 'Tracks', value: 'song' },
  { label: 'Albums', value: 'album' },
  { label: 'Artists', value: 'artist' },
  { label: 'Playlists', value: 'playlist' }
];

const RECENT_SEARCHES_KEY = '@kainetic_recent_searches';

export default function SearchTab() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('song');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  const setCurrentTrack = usePlayerStore((state) => state.setCurrentTrack);
  const setQueue = usePlayerStore((state) => state.setQueue);
  const [loadingTrackId, setLoadingTrackId] = useState<string | null>(null);

  useEffect(() => {
    loadRecentSearches();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearch(searchQuery);
    }
  }, [activeFilter]);

  const loadRecentSearches = async () => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load recent searches', e);
    }
  };

  const saveRecentSearch = async (query: string) => {
    try {
      const updated = [query, ...recentSearches.filter(q => q !== query)].slice(0, 10);
      setRecentSearches(updated);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save recent search', e);
    }
  };

  const clearRecentSearches = async () => {
    try {
      setRecentSearches([]);
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (e) {
      console.error('Failed to clear recent searches', e);
    }
  };

  const executeSearch = () => {
    if (searchQuery.trim()) {
      saveRecentSearch(searchQuery.trim());
      handleSearch(searchQuery);
    }
  };

  const handleRecentSearchClick = (query: string) => {
    setSearchQuery(query);
    handleSearch(query);
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    setIsSearching(true);
    Keyboard.dismiss();
    try {
      const results = await YouTubeSearchService.search(query, activeFilter);
      setSearchResults(results);
    } catch (e) {
      console.error(e);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handlePlayTrack = async (track: SearchResult, index: number) => {
    try {
      if (track.type !== 'song' || !track.videoId) {
        if (track.type === 'playlist') router.push(`/playlist/${track.id}`);
        else if (track.type === 'album') router.push(`/album/${track.id}`);
        else if (track.type === 'artist') router.push(`/artist/${track.id}`);
        return;
      }
      
      setLoadingTrackId(track.videoId);
      
      const mappedTrack: Track = {
        videoId: track.videoId,
        title: track.title,
        artist: track.channelTitle || 'Unknown Artist',
        thumbnailUrl: track.thumbnailUrl,
        durationMs: track.durationMs || 0
      };

      setQueue([mappedTrack], 0);
      setCurrentTrack(mappedTrack);
      await AudioService.playTrack(mappedTrack.videoId);
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
      <View style={styles.searchBarContainer}>
        <Search color="#888" size={20} />
        <TextInput 
          style={styles.searchInput}
          placeholder="What do you want to play?"
          placeholderTextColor="#888"
          returnKeyType="search"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={executeSearch}
          autoFocus
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchResults([]); }}>
            <X color="#888" size={20} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {searchQuery.trim().length === 0 ? (
          // Empty State: Recent Searches
          <View style={styles.recentContainer}>
            <View style={styles.recentHeader}>
              <Text style={styles.sectionTitle}>Recent Searches</Text>
              {recentSearches.length > 0 && (
                <TouchableOpacity onPress={clearRecentSearches}>
                  <Text style={styles.clearText}>Clear All</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {recentSearches.length === 0 ? (
              <Text style={styles.placeholderText}>Your recent searches will appear here.</Text>
            ) : (
              recentSearches.map((query, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.recentItem}
                  onPress={() => handleRecentSearchClick(query)}
                >
                  <Clock color="#888" size={20} />
                  <Text style={styles.recentItemText}>{query}</Text>
                  <X color="#444" size={20} />
                </TouchableOpacity>
              ))
            )}
          </View>
        ) : (
          // Active Search State
          <>
            <Text style={styles.resultsTitle}>Search Results for "{searchQuery}"</Text>
            
            {/* Filter Tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersWrapper} contentContainerStyle={styles.filtersContainer}>
              {FILTERS.map(filter => (
                <TouchableOpacity 
                  key={filter.value}
                  style={[styles.filterChip, activeFilter === filter.value && styles.activeFilterChip]}
                  onPress={() => setActiveFilter(filter.value)}
                >
                  <Text style={[styles.filterText, activeFilter === filter.value && styles.activeFilterText]}>
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {isSearching ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#1db954" />
              </View>
            ) : searchResults.length > 0 ? (
              activeFilter === 'song' ? (
                // List Layout for Tracks
                <View style={styles.trackListContainer}>
                  {searchResults.map((result, i) => (
                    <TrackListItem
                      key={result.videoId || result.id || i}
                      track={{
                        videoId: result.videoId || '',
                        title: result.title,
                        artist: result.channelTitle || 'Unknown Artist',
                        thumbnailUrl: result.thumbnailUrl,
                        durationMs: result.durationMs || 0
                      }}
                      index={i}
                      isLoading={loadingTrackId === result.videoId}
                      onPress={() => handlePlayTrack(result, i)}
                    />
                  ))}
                </View>
              ) : (
                // Grid Layout for Albums, Artists, Playlists
                <View style={styles.resultsGrid}>
                  {searchResults.map((result, i) => (
                    <View key={result.videoId || result.id || i} style={styles.resultItem}>
                      <TrackCard 
                        track={{
                          videoId: result.videoId || '',
                          title: result.title,
                          artist: result.channelTitle || 'Unknown Artist',
                          thumbnailUrl: result.thumbnailUrl,
                          durationMs: result.durationMs || 0
                        }}
                        isArtist={activeFilter === 'artist'}
                        isLoading={loadingTrackId === result.videoId}
                        onPress={() => handlePlayTrack(result, i)}
                      />
                    </View>
                  ))}
                </View>
              )
            ) : (
              <View style={styles.centerContainer}>
                <Text style={styles.placeholderText}>No results found for {FILTERS.find(f => f.value === activeFilter)?.label.toLowerCase()}.</Text>
              </View>
            )}
          </>
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
    paddingTop: 10,
    paddingBottom: 160,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 16,
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
  recentContainer: {
    paddingHorizontal: 16,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  clearText: {
    color: '#aaa',
    fontSize: 14,
    fontWeight: '600',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  recentItemText: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    marginLeft: 16,
  },
  placeholderText: {
    color: '#666',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 20,
  },
  resultsTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 16,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  filtersWrapper: {
    marginBottom: 20,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  activeFilterChip: {
    backgroundColor: '#fff',
  },
  filterText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  activeFilterText: {
    color: '#000',
  },
  trackListContainer: {
    paddingHorizontal: 0,
  },
  resultsGrid: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  resultItem: {
    marginBottom: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
});
