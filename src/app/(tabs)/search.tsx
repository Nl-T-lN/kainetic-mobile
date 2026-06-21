import React, { useState, useEffect, useCallback, memo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput, Keyboard, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Search, Clock, X } from 'lucide-react-native';
import TopBar from '@/components/ui/TopBar';
import ScreenWrapper from '@/components/ui/ScreenWrapper';
import { TrackList } from '@/components/features/TrackList';
import { PlaylistCard } from '@/components/features/PlaylistCard';
import { ArtistCard } from '@/components/features/ArtistCard';
import { YouTubeSearchService } from '@/services/YouTubeSearchService';
import { usePlayerStore } from '@/store/playerStore';
import type { SearchResult, Track } from '@/types/music';

type FilterType = 'song' | 'album' | 'artist' | 'playlist';
const FILTERS: { label: string; value: FilterType }[] = [
  { label: 'Tracks', value: 'song' },
  { label: 'Albums', value: 'album' },
  { label: 'Artists', value: 'artist' },
  { label: 'Playlists', value: 'playlist' }
];

const RECENT_SEARCHES_KEY = '@kainetic_recent_searches';

const FilterTabs = memo(({ activeFilter, onFilterChange }: { activeFilter: FilterType, onFilterChange: (v: FilterType) => void }) => (
  <View style={styles.filtersWrapper}>
    <FlatList 
      horizontal 
      showsHorizontalScrollIndicator={false} 
      data={FILTERS}
      keyExtractor={item => item.value}
      contentContainerStyle={styles.filtersContainer}
      renderItem={({ item }) => (
        <TouchableOpacity 
          style={[styles.filterChip, activeFilter === item.value && styles.activeFilterChip]}
          onPress={() => onFilterChange(item.value)}
        >
          <Text style={[styles.filterText, activeFilter === item.value && styles.activeFilterText]}>
            {item.label}
          </Text>
        </TouchableOpacity>
      )}
    />
  </View>
));

export default function SearchTab() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [searchQuery, setSearchQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('song');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  const setCurrentTrack = usePlayerStore((state) => state.setCurrentTrack);
  const setQueue = usePlayerStore((state) => state.setQueue);

  useEffect(() => {
    loadRecentSearches();
  }, []);

  const loadRecentSearches = async () => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) setRecentSearches(JSON.parse(stored));
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
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify([]));
    } catch (e) {
      console.error('Failed to clear recent searches', e);
    }
  };

  const handleSearch = useCallback(async (query: string) => {
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
  }, [activeFilter]);

  const executeSearch = () => {
    if (searchQuery.trim()) {
      saveRecentSearch(searchQuery.trim());
      setSubmittedQuery(searchQuery.trim());
      handleSearch(searchQuery.trim());
    }
  };

  const handlePlayTrack = useCallback(async (track: SearchResult | Track, index: number) => {
    try {
      const isSearchResult = 'type' in track;
      if (isSearchResult) {
        const sr = track as SearchResult;
        if (sr.type !== 'song' || !sr.videoId) {
          if (sr.type === 'playlist') router.push(`/playlist/${sr.id}`);
          else if (sr.type === 'album') router.push(`/album/${sr.id}`);
          else if (sr.type === 'artist') router.push(`/artist/${sr.id}`);
          return;
        }
      }
      
      const videoId = isSearchResult ? (track as SearchResult).videoId : (track as Track).videoId;
      const mappedTrack: Track = {
        videoId: videoId!,
        title: track.title,
        artist: track.channelTitle || ('artist' in track ? track.artist : 'Unknown Artist') || 'Unknown Artist',
        thumbnailUrl: track.thumbnailUrl,
        durationMs: track.durationMs || 0
      };

      setQueue([mappedTrack], 0);
      setCurrentTrack(mappedTrack);

      YouTubeSearchService.getUpNext(mappedTrack.videoId).then(upNextTracks => {
        if (upNextTracks.length > 0) {
           const currentStore = usePlayerStore.getState();
           if (currentStore.currentTrack?.videoId === mappedTrack.videoId) {
              setQueue([mappedTrack, ...upNextTracks], 0);
           }
        }
      }).catch(console.error);

    } catch (error) {
      console.error("Playback failed:", error);
    }
  }, [router, setCurrentTrack, setQueue]);

  useEffect(() => {
    if (submittedQuery.trim()) {
      handleSearch(submittedQuery);
    }
  }, [activeFilter, submittedQuery, handleSearch]);

  const renderContent = () => {
    if (isSearching) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#1db954" />
        </View>
      );
    }

    if (searchResults.length === 0) {
      if (submittedQuery) {
        return (
          <View style={styles.centerContainer}>
            <Text style={styles.placeholderText}>No results found.</Text>
          </View>
        );
      }
      return (
        <FlatList
          key="recent-searches"
          data={recentSearches}
          keyExtractor={(item, index) => `${item}-${index}`}
          ListHeaderComponent={<Text style={styles.sectionTitle}>Recent Searches</Text>}
          ListHeaderComponentStyle={{ marginBottom: 16 }}
          contentContainerStyle={styles.recentContainer}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.recentItem}
              onPress={() => {
                setSearchQuery(item);
                setSubmittedQuery(item);
                handleSearch(item);
              }}
            >
              <Clock color="#888" size={20} />
              <Text style={styles.recentItemText}>{item}</Text>
              <X color="#444" size={20} />
            </TouchableOpacity>
          )}
          ListFooterComponent={recentSearches.length > 0 ? (
            <TouchableOpacity onPress={clearRecentSearches} style={styles.clearButton}>
              <Text style={styles.clearText}>Clear All Searches</Text>
            </TouchableOpacity>
          ) : null}
        />
      );
    }

    if (activeFilter === 'song') {
      const songs = searchResults
        .filter(r => r.type === 'song')
        .map(r => ({
          videoId: r.videoId || '',
          title: r.title,
          artist: r.channelTitle || 'Unknown Artist',
          thumbnailUrl: r.thumbnailUrl,
          durationMs: r.durationMs || 0
        }));

      return (
        <TrackList 
          tracks={songs} 
          onTrackSelect={handlePlayTrack} 
          contentContainerStyle={styles.trackListContent}
        />
      );
    }

    return (
      <FlatList
        key={`grid-${activeFilter}`}
        data={searchResults.filter(r => r.type === activeFilter)}
        numColumns={2}
        keyExtractor={(item, i) => item.id || `${i}`}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.gridContent}
        renderItem={({ item, index }) => (
          <View style={styles.resultItem}>
            {activeFilter === 'artist' ? (
              <ArtistCard
                id={item.id}
                name={item.channelTitle || item.title || "Artist"}
                thumbnailUrl={item.thumbnailUrl}
                onPress={() => item.id && router.push(`/artist/${item.id}`)}
                style={{ width: '100%', marginRight: 0 }}
              />
            ) : (
              <PlaylistCard
                id={item.id}
                title={item.title}
                subtitle={item.channelTitle}
                thumbnailUrl={item.thumbnailUrl}
                onPress={() => handlePlayTrack(item, index)}
                style={{ width: '100%', marginRight: 0 }}
              />
            )}
          </View>
        )}
      />
    );
  };

  return (
    <ScreenWrapper style={styles.container}>
      <TopBar title="Search" />
      <View style={styles.searchBarContainer}>
        <Search color="#888" size={20} />
        <TextInput 
          style={styles.searchInput}
          placeholder="What do you want to play?"
          placeholderTextColor="#888"
          returnKeyType="search"
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            if (text.trim() === '') {
              setSearchResults([]);
              setSubmittedQuery('');
            }
          }}
          onSubmitEditing={executeSearch}
          autoFocus
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => { setSearchQuery(''); setSubmittedQuery(''); setSearchResults([]); }}>
            <X color="#888" size={20} />
          </TouchableOpacity>
        )}
      </View>

      <FilterTabs activeFilter={activeFilter} onFilterChange={setActiveFilter} />

      <View style={styles.flexContent}>
        {renderContent()}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  flexContent: {
    flex: 1,
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
    paddingTop: 10,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  clearButton: {
    padding: 16,
    alignItems: 'center',
  },
  clearText: {
    color: '#888',
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
  filtersWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 0,
  },
  filtersContainer: {
    paddingHorizontal: 8,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeFilterChip: {
    borderBottomColor: '#fff',
  },
  filterText: {
    color: '#888',
    fontSize: 15,
    fontWeight: '600',
  },
  activeFilterText: {
    color: '#fff',
  },
  trackListContent: {
    paddingHorizontal: 8,
    paddingTop: 16,
    paddingBottom: 160,
  },
  gridContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 160,
  },
  gridRow: {
    justifyContent: 'space-between',
  },
  resultItem: {
    width: '47%',
    marginBottom: 24,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
});
